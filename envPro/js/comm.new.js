$(document).ready(function() {
    // 从localStorage获取当前登录用户信息
    let currentUser = JSON.parse(localStorage.getItem('currentUser'));
    // 如果localStorage中没有用户信息，使用默认值
    if (!currentUser) {
        currentUser = {
            id: "f9ea5e02-f813-4e1b-ae17-e6a618980f6a",
            name: "环保先锋",
            avatar: "6"
        };
    }

    // 存储动态数据
    let publicDynamics = [];
    let myDynamics = [];

    // 当前激活的标签页
    let activeTab = "public";

  let selectedImages = []; // 存储选中的图片文件
    $('#dynamicImages').on('change', function(e) {
        const files = e.target.files;
        if (!files.length) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.type.startsWith('image/')) continue;

            // 添加到选中图片数组
            selectedImages.push(file);

            // 创建预览元素
            const reader = new FileReader();
            reader.onload = function(event) {
                const previewItem = `
                    <div class="preview-item" data-index="${selectedImages.length - 1}">
                        <img src="${event.target.result}" alt="预览图片">
                        <span class="remove-img" data-index="${selectedImages.length - 1}">×</span>
                    </div>
                `;
                $('#imagePreview').append(previewItem);
            };
            reader.readAsDataURL(file);
        }

        // 清空input值，允许重复选择相同文件
        $('#dynamicImages').val('');
    });

    // 删除预览图片
    $('#imagePreview').on('click', '.remove-img', function() {
        const index = $(this).data('index');
        // 从数组中移除
        selectedImages.splice(index, 1);
        // 从DOM中移除
        $(this).parent('.preview-item').remove();
        // 更新剩余图片的索引
        $('#imagePreview .preview-item').each(function(i) {
            $(this).data('index', i);
            $(this).find('.remove-img').data('index', i);
        });
    });

     // 发布动态表单提交
    $('#dynamicPostForm').on('submit', function(e) {
        e.preventDefault();
        
        // 获取动态内容
        const content = $('#dynamicContent').val().trim();
        if (!content) {
            alert('请输入动态内容！');
            return;
        }

        // 获取选中的权限
        const privacy = $('input[name="privacy"]:checked').val();

        // 创建FormData对象
        const formData = new FormData();
        formData.append('user_id', currentUser.id);
        formData.append('content', content);
        formData.append('permission', privacy);

        // 添加图片文件
        if (selectedImages.length > 0) {
            for (let i = 0; i < selectedImages.length; i++) {
                formData.append('images', selectedImages[i]);
            }
        }

        // 发送POST请求到后端API
        axios.post('http://localhost:3000/api/post', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        .then(response => {
            if (response.data.success) {
                // 重新获取动态列表
                fetchPublicDynamics();
                fetchMyDynamics();

                // 重置表单和预览
                $('#dynamicContent').val('');
                $('#imagePreview').empty();
                selectedImages = [];
                // 重置权限选择为公开
                $('input[name="privacy"][value="public"]').prop('checked', true);

                alert(`动态发布成功！${privacy === 'public' ? '该动态对所有用户可见' : '该动态仅你自己可见'}`);
            } else {
                alert('发布失败：' + response.data.message);
            }
        })
        .catch(error => {
            console.error('发布动态失败：', error);
            alert('发布失败，请稍后重试');
        });
    });

    // 切换标签页
    $('.tab-item').on('click', function() {
        // 更新标签页样式
        $('.tab-item').removeClass('active');
        $(this).addClass('active');
        // 更新激活标签
        activeTab = $(this).data('tab');
        // 重新渲染列表
        renderDynamicList();
    });

    // 删除动态功能（修复版）
$(document).on('click', '.delete-btn', function() {
    const dynamicId = $(this).data('id');
    
    // 二次确认删除
    if (!confirm('确定要删除这条动态吗？删除后无法恢复！')) {
        return;
    }

    // 发送DELETE请求到后端API
    axios.delete(`http://localhost:3000/api/post/${dynamicId}`, {
        data: { user_id: currentUser.id }
    })
    .then(response => {
        if (response.data.success) {
            // 🔥 关键修复：删除后重新拉取数据，而不是手动删数组
            fetchPublicDynamics();
            fetchMyDynamics();
            
            alert('动态删除成功！');
        } else {
            alert('删除失败：' + response.data.message);
        }
    })
    .catch(error => {
        console.error('删除动态失败：', error);
        alert('删除失败，请稍后重试');
    });
});


      // 点赞功能（最终完美版，解决400）
$('#dynamicList').off('click').on('click', '.like-btn', function() {
    const dynamicId = $(this).data('id');
    const isLiked = $(this).data('liked') === true;
    const $likeBtn = $(this);
    const $icon = $likeBtn.find('i');
    const $count = $likeBtn.find('span');

    if (!isLiked) {
        // 点赞
        axios({
            method: 'POST',
            url: `http://localhost:3000/api/post/${dynamicId}/like`,
            data: `user_id=${currentUser.id}`,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
        .then(response => {
            if (response.data.success) {
                $icon.removeClass('fa-heart-o').addClass('fa-heart');
                $count.text(response.data.like_count);
                $likeBtn.data('liked', true);
                updateLocalDynamicLikeStatus(dynamicId, true, response.data.like_count);
            }
        })
        .catch(error => {
            console.error('点赞失败：', error);
            alert('点赞失败：' + (error.response?.data?.message || '服务器错误'));
        });
    } else {
        // 取消点赞
        axios({
            method: 'DELETE',
            url: `http://localhost:3000/api/post/${dynamicId}/like`,
            data: `user_id=${currentUser.id}`,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
        .then(response => {
            if (response.data.success) {
                $icon.removeClass('fa-heart').addClass('fa-heart-o');
                $count.text(response.data.like_count);
                $likeBtn.data('liked', false);
                updateLocalDynamicLikeStatus(dynamicId, false, response.data.like_count);
            }
        })
        .catch(error => {
            console.error('取消点赞失败：', error);
            alert('取消点赞失败');
        });
    }
});
    // 更新本地动态的点赞状态
    function updateLocalDynamicLikeStatus(dynamicId, isLiked, likeCount) {
        // 更新公开动态列表
        publicDynamics.forEach(dynamic => {
            if (dynamic.id === dynamicId) {
                dynamic.isLiked = isLiked;
                dynamic.likeCount = likeCount;
            }
        });
        
        // 更新我的动态列表
        myDynamics.forEach(dynamic => {
            if (dynamic.id === dynamicId) {
                dynamic.isLiked = isLiked;
                dynamic.likeCount = likeCount;
            }
        });
    }

    // 获取公开动态
function fetchPublicDynamics() {
    axios.get(`http://localhost:3000/api/post/public?user_id=${currentUser.id}`)
        .then(response => {
            if (response.data.success) {
                publicDynamics = response.data.posts.map(post => ({
                    id: post.id,
                    userId: post.user_id,
                    userName: post.user_id === currentUser.id ? currentUser.name : "其他用户",
                    userAvatar: post.user_id === currentUser.id ? currentUser.avatar : "他",
                    content: post.content,
                    images: post.image_url ? post.image_url.split(',').filter(url => url.trim()) : [],
                    createTime: new Date(post.created_at).toLocaleString(),
                    privacy: post.permission,
                    likeCount: post.like_count || 0,
                    isLiked: post.is_liked || false
                }));
                if (activeTab === "public") {
                    renderDynamicList();
                }
            } else {
                console.error('获取公开动态失败：', response.data.message);
            }
        })
        .catch(error => {
            console.error('获取公开动态失败：', error);
        });
}

    // 获取我的动态
    function fetchMyDynamics() {
        axios.get(`http://localhost:3000/api/post/user/${currentUser.id}?user_id=${currentUser.id}`)
            .then(response => {
                if (response.data.success) {
                    myDynamics = response.data.posts.map(post => ({
                        id: post.id,
                        userId: post.user_id,
                        userName: currentUser.name,
                        userAvatar: currentUser.avatar,
                        content: post.content,
                        images: post.image_url ? post.image_url.split(',').filter(url => url.trim()) : [],
                        createTime: new Date(post.created_at).toLocaleString(),
                        privacy: post.permission,
                        likeCount: post.like_count || 0,
                        isLiked: post.is_liked || false
                    }));
                    if (activeTab === "my-all") {
                        renderDynamicList();
                    }
                } else {
                    console.error('获取我的动态失败：', response.data.message);
                }
            })
            .catch(error => {
                console.error('获取我的动态失败：', error);
            });
    }

   function renderDynamicList() {
        const $dynamicList = $('#dynamicList');
        $dynamicList.empty();

        let displayList = [];

        if (activeTab === "public") {
            // 社区公开动态
            displayList = [...publicDynamics].sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
        } else if (activeTab === "my-all") {
            // 我的所有动态：公开 + 私人
            displayList = [...myDynamics].sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
        }

        if (displayList.length === 0) {
            const emptyText = activeTab === "public" 
                ? "暂无社区公开动态，快来发布第一条环保动态吧！" 
                : "你还没有发布任何动态，快来分享你的环保行动吧！";
            $dynamicList.html(`
                <div class="text-center" id="emptyTip">
                    <i class="fa fa-leaf" style="font-size: 48px; color: #4CAF50; margin-bottom: 15px;"></i>
                    <p>${emptyText}</p>
                </div>
            `);
            return;
        }

        // 遍历生成动态项 - 保持最新在顶部的顺序
        displayList.forEach(dynamic => {
            // 确保用户名和头像有默认值
            const safeUserName = dynamic.userName || "匿名用户";
            const safeUserAvatar = dynamic.userAvatar || "环";
            
            // 构建图片HTML
            let imagesHtml = '';
            if (dynamic.images && dynamic.images.length > 0) {
                imagesHtml = '<div class="dynamic-images">';
                dynamic.images.forEach(imgUrl => {
                    imagesHtml += `<img src="${imgUrl}" alt="动态图片">`;
                });
                imagesHtml += '</div>';
            }

            // 构建权限标签
            const privacyTag = dynamic.privacy === "public" 
                ? `<span class="privacy-tag tag-public"><i class="fa fa-globe"></i> 公开</span>` 
                : `<span class="privacy-tag tag-private"><i class="fa fa-lock"></i> 私人</span>`;

            // 构建删除按钮（仅自己的动态显示）
            const deleteBtn = dynamic.userId === currentUser.id 
                ? `<div class="delete-btn" data-id="${dynamic.id}"><i class="fa fa-trash-o"></i></div>` 
                : '';

            // 构建点赞相关元素
            let likeElement = '';
            if (dynamic.userId !== currentUser.id) {
                // 其他人的动态：显示点赞按钮和数量
                likeElement = `
                    <div class="dynamic-footer">
                        <div class="like-btn" data-id="${dynamic.id}" data-liked="${dynamic.isLiked}">
                            <i class="fa ${dynamic.isLiked ? 'fa-heart' : 'fa-heart-o'}"></i>
                            <span>${dynamic.likeCount}</span>
                        </div>
                    </div>
                `;
            } else {
                // 自己的动态：只显示点赞数量，不显示点赞按钮
                likeElement = `
                    <div class="dynamic-footer">
                        <div class="like-count">
                            <i class="fa fa-heart"></i>
                            <span>${dynamic.likeCount}</span>
                        </div>
                    </div>
                `;
            }

            // 构建动态项HTML
            const dynamicItem = `
                <div class="dynamic-item" data-id="${dynamic.id}">
                    ${deleteBtn}
                    <div class="dynamic-header">
                        <div class="user-avatar">${safeUserAvatar}</div>
                        <div class="user-info">
                            <h4>${safeUserName} ${privacyTag}</h4>
                            <span class="post-time">${dynamic.createTime}</span>
                        </div>
                    </div>
                    <div class="dynamic-content">${dynamic.content}</div>
                    ${imagesHtml}
                    ${likeElement}
                </div>
            `;

            $dynamicList.append(dynamicItem);
        });
    }

    // 初始化获取数据
    fetchPublicDynamics();
    fetchMyDynamics();
});