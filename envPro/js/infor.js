$(document).ready(function() {

    // 初始状态：隐藏所有编辑相关元素
    let isEditMode = false;
    let selectedAvatar = 'girl.png'; // 默认头像
    
    // 从localStorage获取当前登录用户信息
    let currentUser = null;
    try {
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
    } catch (error) {
        console.error('解析localStorage中的用户信息失败:', error);
        localStorage.removeItem('currentUser'); // 清除损坏的数据
    }
    // 有登录用户则使用其ID，否则跳登录（更严谨）
    const currentUserId = currentUser ? currentUser.id : '';
    if (!currentUserId) {
        alert('请先登录！');
        window.location.href = 'login.html';
        return; // 终止后续代码执行
    }

    // 页面加载时获取用户信息
    fetchUserInfo(currentUserId);
    
    // 【新增】获取并更新动态数量
    fetchDynamicCount(currentUserId);
    
    // 从后端获取用户信息的函数（补充生日字段，增加容错性）
function fetchUserInfo(userId) {
    // 1. 先校验userId是否有效
    if (!userId || userId === '' || userId === 'undefined') {
        console.error('用户ID为空，无法获取用户信息');
        alert('用户ID无效，请重新登录！');
        // 兜底默认数据
        setDefaultUserInfo();
        return;
    }

    // 2. 发起请求，增加超时配置
    axios.get(`http://localhost:3000/api/user/info/${userId}`, {
        timeout: 5000 // 5秒超时
    })
    .then(response => {
        // 校验响应数据是否有效
        if (!response.data) {
            throw new Error('后端返回空数据');
        }
        if (!response.data.success) {
            throw new Error(response.data.message || '获取用户信息失败');
        }

        const user = response.data.user || {}; // 防止user为null/undefined
        // 填充用户信息到页面
        $('#usernameText').text(user.username || '绿色践行者');
        const displayName = user.nickname || user.username || '绿色践行者';
        $('#profileName').text(displayName);
        $('#nicknameText').text(user.nickname || '未设置昵称'); // 更新昵称显示
        $('#emailText').text(user.email || 'green_life@example.com');

        // 手机号脱敏（增加非空校验）
        if (user.phone && /^\d{11}$/.test(user.phone)) { // 校验是否为11位手机号
            $('#phoneText').text(user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'));
        } else {
            $('#phoneText').text('未设置手机号');
        }

        // 生日字段（增加日期格式化容错）
        let birthdayText = '未设置生日';
        if (user.birthday) {
            const birthday = new Date(user.birthday);
            // 校验日期是否有效
            if (!isNaN(birthday.getTime())) {
                const year = birthday.getFullYear();
                const month = (birthday.getMonth() + 1).toString().padStart(2, '0');
                const day = birthday.getDate().toString().padStart(2, '0');
                birthdayText = `${year}-${month}-${day}`;
            }
        }
        $('#birthdayText').text(birthdayText);

        // 城市字段
        $('#cityText').text(user.city || '未设置城市');

        // 设置输入框初始值（增加元素存在性校验）
        const nicknameInput = $('#nicknameInput');
        if (nicknameInput.length) {
            nicknameInput.val(displayName);f
        }
        if ($('#emailInput').length) {
            $('#emailInput').val(user.email || '');
        }
        if ($('#phoneInput').length) {
            $('#phoneInput').val(user.phone || '');
        }
        if ($('#birthdayInput').length) {
            // 生日输入框赋值（仅传有效日期）
            const birthday = new Date(user.birthday);
            $('#birthdayInput').val(!isNaN(birthday.getTime()) ? birthdayText : '');
        }
        if ($('#cityInput').length) {
            $('#cityInput').val(user.city || '');
        }

        // 更新头像
        if (user.avatar) {
            selectedAvatar = user.avatar;
            $('#currentAvatar').attr('src', `images/${user.avatar}`);
        }

        // 更新动态数量
/*         $('#dynamicNumber').text(user.dynamic_count || 0);
 */
        // 更新加入时间
        if (user.created_at) {
            const joinDate = new Date(user.created_at);
            if (!isNaN(joinDate.getTime())) {
                const year = joinDate.getFullYear();
                const month = (joinDate.getMonth() + 1).toString().padStart(2, '0');
                const day = joinDate.getDate().toString().padStart(2, '0');
                $('#joinTime').text(`${year}-${month}-${day}`);
            }
        }

        // 更新累计减排量
        $('#carbonReduction').text(user.carbon_reduction || 0);

        console.log('用户信息获取成功:', user);
    })
    .catch(error => {
        // 3. 详细打印错误信息，方便排查
        console.error('获取用户信息失败详情:', {
            message: error.message,
            status: error.response?.status, // 响应状态码（404/500等）
            url: error.config?.url, // 请求的URL
            responseData: error.response?.data // 后端返回的错误信息
        });
        
        // 区分错误类型提示
        let errorMsg = '获取用户信息失败，将使用默认数据！';
        if (error.code === 'ECONNABORTED') {
            errorMsg = '请求超时，请检查网络或后端服务！';
        } else if (error.response?.status === 404) {
            errorMsg = '未找到该用户信息，请检查用户ID！';
        } else if (error.response?.status === 500) {
            errorMsg = '服务器内部错误，请联系管理员！';
        }
        alert(errorMsg);
        
        // 兜底默认数据
        setDefaultUserInfo();
    });
}

/**
 * 【新增】获取并更新用户的动态数量
 * @param {string} userId - 用户ID
 */
/**
 * 【优化版】获取并更新用户的动态数量
 */
function fetchDynamicCount(userId) {
    if (!userId) {
        console.warn('⚠️ fetchDynamicCount: 用户ID为空');
        return;
    }

    const apiUrl = `http://localhost:3000/api/post/user/${userId}`; 

    axios.get(apiUrl)
        .then(response => {
            // 调试日志：查看后端到底返回了什么
            console.log('动态接口返回数据:', response.data);

            if (response.data && response.data.success) {
                let count = 0;
                const posts = response.data.posts; 

                // 兼容情况1: 后端直接返回数组 [ {...}, {...} ]
                if (Array.isArray(posts)) {
                    count = posts.length;
                } 
                // 兼容情况2: 后端返回分页对象 { total: 5, list: [...] } 或 { data: [...] }
                else if (posts && typeof posts === 'object') {
                    // 优先取 total 字段，其次取 count，最后取列表长度
                    count = posts.total || posts.count || (posts.list ? posts.list.length : (posts.data ? posts.data.length : 0));
                }

                // 更新页面
                $('#dynamicNumber').text(count);
                console.log('✅ 动态数量更新成功:', count);
            } else {
                console.warn('⚠️ 接口返回失败:', response.data.message);
                $('#dynamicNumber').text(0);
            }
        })
        .catch(error => {
            console.error('❌ 获取动态数量请求失败:', error);
            // 出错时不要强制设为0，保留原有显示或设为-表示错误，这里暂时设为0
            $('#dynamicNumber').text(0);
        });
}

    // 编辑个人资料按钮点击事件
    $('#editProfileBtn').click(function() {
        if (isEditMode) return;
        
        // 切换到编辑模式
        isEditMode = true;
        
        // 显示修改按钮、输入框、保存按钮、头像选择器
        $('.edit-btn').addClass('visible');
        $('.edit-input').addClass('visible');
        $('.value-text').addClass('hidden');
        $('#saveProfileBtn').addClass('visible');
        $('#avatarSelector').show();
        $(this).hide(); // 隐藏编辑按钮
        
        // 高亮选中当前头像
        $('.avatar-option').removeClass('selected');
        $(`.avatar-option[data-avatar="${selectedAvatar}"]`).addClass('selected');
    });

    // 头像选择事件
    $('.avatar-option').click(function() {
        // 移除其他选中状态
        $('.avatar-option').removeClass('selected');
        // 添加当前选中状态
        $(this).addClass('selected');
        // 更新选中的头像
        selectedAvatar = $(this).data('avatar');
        // 预览头像
        $('#currentAvatar').attr('src', `images/${selectedAvatar}`);
    });

    // 保存修改按钮点击事件（新增生日字段）
    $('#saveProfileBtn').click(function() {
        if (!isEditMode) return;
        
        // 1. 更新头像
        $('#currentAvatar').attr('src', `images/${selectedAvatar}`);
        
        // 2. 准备更新的用户信息（新增birthday）
        const nicknameInput = $('#nickname');
        let newNickname = '';
        if (nicknameInput.length && nicknameInput.val().trim()) {
            newNickname = nicknameInput.val().trim();
        } else {
            newNickname = $('#nicknameText').text().trim() || '绿色践行者';
        }

        const updateData = {
            nickname: newNickname,
            email: $('#emailInput').val().trim() || '',
            phone: $('#phoneInput').val().trim() || '',
            birthday: $('#birthdayInput').val().trim() || '', // 新增生日字段
            city: $('#cityInput').val().trim() || '',
            avatar: selectedAvatar // 添加头像信息
        };
        
        // 3. 调用后端接口保存用户信息
        const updateUrl = `http://localhost:3000/api/user/update/${currentUserId}`;
        axios.put(updateUrl, updateData, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (response.data.success) {
                    // 更新页面显示
                    $('#profileName').text(updateData.nickname); // 同步更新顶部用户名显示
                    $('#nicknameText').text(updateData.nickname); // 同步更新昵称文本显示
                    $('#emailText').text(updateData.email || '未设置邮箱');
                    
                    // 处理手机号脱敏显示
                    if (updateData.phone && updateData.phone.length === 11) {
                        $('#phoneText').text(updateData.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'));
                    } else {
                        $('#phoneText').text('未设置手机号');
                    }
                    
                    // 生日字段更新（新增）
                    if (updateData.birthday) {
                        $('#birthdayText').text(updateData.birthday);
                    } else {
                        $('#birthdayText').text('未设置生日');
                    }
                    
                    // 城市字段更新
                    $('#cityText').text(updateData.city || '未设置城市');
                    
                    // 4. 退出编辑模式
                    isEditMode = false;
                    
                    // 隐藏编辑相关元素，恢复只读状态
                    $('.edit-btn').removeClass('visible');
                    $('.edit-input').removeClass('visible');
                    $('.value-text').removeClass('hidden');
                    $('#saveProfileBtn').removeClass('visible');
                    $('#avatarSelector').hide();
                    $('#editProfileBtn').show(); // 显示编辑按钮

                    // 提示修改成功
                    alert('个人信息修改成功！');
                    
                    console.log('用户信息保存成功:', response.data.user);
                } else {
                    console.error('保存用户信息失败:', response.data.message);
                    alert('保存失败: ' + response.data.message);
                }
            })
            .catch(error => {
                console.error('保存用户信息时发生错误:', error);
                if (error.response) {
                    console.error('错误状态码:', error.response.status);
                    console.error('错误响应数据:', error.response.data);
                    alert(`保存失败: ${error.response.status} ${JSON.stringify(error.response.data)}`);
                } else {
                    console.error('错误详情:', error.message);
                    alert('保存失败: ' + error.message);
                }
            });
    });

    // 点击修改按钮聚焦对应输入框（可选优化）
    $('.edit-btn').click(function() {
        const $input = $(this).siblings('.edit-input');
        if ($input.length) {
            $input.focus();
        }
    });

    // 修改密码按钮点击事件
$('#changePasswordBtn').click(function() {
    $('#changePasswordModal').modal('show');
});

// 旧密码验证（改为失去焦点时验证，减少请求）
$('#oldPassword').on('blur', function() {
    const oldPassword = $(this).val().trim(); // 加trim去除首尾空格
    const $error = $('#oldPasswordError');
    
    if (!oldPassword) {
        $error.text('请输入旧密码').show();
        return;
    }
    
    // 验证旧密码是否正确
    verifyOldPassword(oldPassword);
});

// 新密码验证
$('#newPassword').on('input', function() {
    const newPassword = $(this).val().trim();
    const $error = $('#newPasswordError');
    
    if (!newPassword) {
        $error.hide();
        return;
    }
    
    if (newPassword.length < 6) {
        $error.text('密码长度必须6位以上').show();
    } else {
        $error.hide();
        // 验证确认密码
        checkConfirmPassword();
    }
});

// 确认密码验证
$('#confirmPassword').on('input', function() {
    checkConfirmPassword();
});

// 检查确认密码是否匹配
function checkConfirmPassword() {
    const newPassword = $('#newPassword').val().trim();
    const confirmPassword = $('#confirmPassword').val().trim();
    const $error = $('#confirmPasswordError');
    
    if (!confirmPassword) {
        $error.hide();
        return;
    }
    
    if (newPassword !== confirmPassword) {
        $error.text('两次输入的密码不同').show();
    } else {
        $error.hide();
    }
}

// 验证旧密码
function verifyOldPassword(oldPassword) {
    const $error = $('#oldPasswordError');
    $error.text('验证中...').show(); // 加加载提示
    
    // 调用API验证旧密码
    axios.post(`http://localhost:3000/api/user/${currentUserId}/verify-password`, {
        password: oldPassword
    })
    .then(response => {
        if (response.data.success) {
            $error.hide();
        } else {
            $error.text('旧密码错误').show();
        }
    })
    .catch(error => {
        console.error('验证旧密码失败:', error);
        $error.text('验证失败，请重试').show();
    });
}

// 保存密码按钮点击事件
$('#confirmPasswordChangeBtn').click(function() {
    const oldPassword = $('#oldPassword').val().trim();
    const newPassword = $('#newPassword').val().trim();
    const confirmPassword = $('#confirmPassword').val().trim();
    const $oldPwdError = $('#oldPasswordError');
    
    // 检查所有验证条件
    if (!oldPassword) {
        $oldPwdError.text('请输入旧密码').show();
        $('#oldPassword').focus(); // 聚焦到错误输入框
        return;
    }
    
    if ($oldPwdError.is(':visible')) {
        alert('旧密码错误，请重新输入');
        $('#oldPassword').focus();
        return;
    }
    
    if (newPassword.length < 6) {
        $('#newPasswordError').text('密码长度必须6位以上').show();
        $('#newPassword').focus();
        return;
    }
    
    if (newPassword !== confirmPassword) {
        $('#confirmPasswordError').text('两次输入的密码不同').show();
        $('#confirmPassword').focus();
        return;
    }
    
    // 调用API更新密码（userId放在URL路径中）
    axios.put(`http://localhost:3000/api/user/${currentUserId}/update-password`, {
        oldPassword: oldPassword,
        newPassword: newPassword
    })
    .then(response => {
        if (response.data.success) {
            alert('密码修改成功！请重新登录');
            $('#changePasswordModal').modal('hide');
            // 清空密码输入框
            $('#oldPassword, #newPassword, #confirmPassword').val('');
            // 跳转到登录页面
            window.location.href = 'login.html';
        } else {
            alert(`修改失败：${response.data.message || '未知错误'}`);
        }
    })
    .catch(error => {
        console.error('修改密码失败:', error);
        alert('修改失败: ' + (error.response?.data?.message || error.message));
    });
});
    // 注销账户按钮点击事件（打开模态框）
$('#logoutAccountBtn').click(function() {
    // 打开模态框前重置状态
    $('#logoutPassword').val(''); // 清空密码输入框
    $('#logoutPwdError').text('').hide(); // 隐藏错误提示
    $('#logoutAccountModal').modal('show');
});

// 确认注销按钮点击事件（核心逻辑）
$('#confirmLogoutBtn').click(async function() {
    // 1. 获取输入的密码和当前用户ID
    const password = $('#logoutPassword').val().trim();
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const currentUserId = currentUser?.id; // 从localStorage获取用户ID
    const $error = $('#logoutPwdError');

    // 2. 前端基础验证
    try {
        // 检查用户是否登录
        if (!currentUserId) {
            throw new Error('未检测到登录状态，请重新登录');
        }
        // 检查密码是否输入
        if (!password) {
            throw new Error('请输入账户密码以确认注销');
        }

        // 3. 调用后端注销接口（核心）
        const response = await axios.delete(
            `http://localhost:3000/api/user/${currentUserId}/delete-account`,
            {
                data: { password: password } // DELETE请求传请求体必须放data里
            }
        );

        // 4. 接口调用成功处理
        if (response.data.success) {
            // 清除本地用户信息
            localStorage.removeItem('currentUser');
            // 关闭模态框
            $('#logoutAccountModal').modal('hide');
            // 提示并跳转
            alert('🎉 账户注销成功！所有数据已永久删除');
            window.location.href = 'login.html';
        } else {
            // 后端返回失败（如密码错误）
            throw new Error(response.data.message || '注销失败，请重试');
        }

    } catch (error) {
        // 5. 错误处理（详细输出 + 兜底逻辑合并到这里）
        console.error('🔴 注销账户失败详情:', {
            错误类型: error.name,
            错误信息: error.message,
            响应数据: error.response?.data,
            状态码: error.response?.status,
            完整错误: error
        });

        // 显示友好的错误提示
        let errMsg = '';
        if (error.message.includes('Network Error')) {
            errMsg = '服务器连接失败，请检查后端服务是否启动';
        } else if (error.response?.status === 404) {
            errMsg = '用户不存在，可能已被注销';
        } else if (error.response?.status === 400) {
            errMsg = error.response.data.message || '密码错误，无法注销';
        } else if (error.response?.status === 500) {
            errMsg = '服务器内部错误，请联系管理员';
        } else {
            errMsg = error.message || '注销失败，请重试';
        }

        // 显示错误提示到页面
        $error.text(`❌ ${errMsg}`).show();
        // 聚焦到密码输入框
        $('#logoutPassword').focus();

        // 原来的兜底逻辑合并到这里（无需单独catch）
        console.error('🔴 注销流程总异常:', error);
        // 可选：如果需要弹窗提示，保留这行；不需要则删掉
        // alert(`注销失败：${error.message}`);
    }
});

// 可选：模态框关闭时清空错误提示
$('#logoutAccountModal').on('hidden.bs.modal', function() {
    $('#logoutPwdError').text('').hide();
    $('#logoutPassword').val('');
});

// 退出登录按钮点击事件
$('#logoutBtn').click(function() {
    // 清除localStorage中的用户信息
    localStorage.removeItem('currentUser');
    alert('退出登录成功！');
    window.location.href = 'login.html';
});

// 导航菜单点击事件
$('.nav-item').click(function() {
    // 移除所有导航项的激活状态
    $('.nav-item').removeClass('active');
    // 添加当前导航项的激活状态
    $(this).addClass('active');
    
    // 隐藏所有内容区域
    $('.content-section').removeClass('active');
    // 显示对应的内容区域
    const target = $(this).data('target');
    $('#' + target).addClass('active');
});

// 日历功能实现
$(document).ready(function() {
    let currentDate = new Date();
    let checkins = {};
    
    // 从数据库获取打卡记录
    function fetchCheckins() {
        axios.get(`http://localhost:3000/api/checkin/user/${currentUserId}`)
        .then(response => {
            if (response.data.success) {
                const records = response.data.data;
                // 构建打卡记录对象
                records.forEach(record => {
                    // 将日期格式转换为 YYYY-MM-DD 格式
                    const date = new Date(record.checkin_date);
                    const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
                    checkins[dateStr] = true;
                });
                // 初始化日历
                renderCalendar(currentDate);
                // 初始化用户数据
                updateUserStats();
                // 显示历史打卡记录
                showHistory();
                // 初始化打卡按钮状态
                $('#checkinBtn').removeClass('disabled').prop('disabled', false);
            }
        })
        .catch(error => {
            console.error('获取打卡记录失败:', error);
            // 初始化日历
            renderCalendar(currentDate);
            // 初始化用户数据
            updateUserStats();
            // 显示历史打卡记录
            showHistory();
            // 初始化打卡按钮状态
            $('#checkinBtn').removeClass('disabled').prop('disabled', false);
        });
    }
    
    // 初始化打卡记录
    fetchCheckins();
    
    // 上一个月按钮点击事件
    $('#prevMonth').click(function() {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate);
    });
    
    // 下一个月按钮点击事件
    $('#nextMonth').click(function() {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(currentDate);
    });
    
    // 打卡按钮点击事件
    $('#checkinBtn').click(function() {
        $('#checkinModal').modal('show');
    });
    
    // 其他选项点击事件
    $('input[name="behavior"]').change(function() {
        if ($(this).val() === '其他') {
            $('#customBehavior').show();
        } else {
            $('#customBehavior').hide();
        }
    });
    
    // 确认打卡按钮点击事件
    $('#confirmCheckinBtn').click(function() {
        handleCheckin();
    });
    
    // 渲染日历
    function renderCalendar(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        
        // 更新日历标题
        $('#currentMonth').text(`${year}年${month + 1}月`);
        
        // 获取当月第一天
        const firstDay = new Date(year, month, 1);
        // 获取当月最后一天
        const lastDay = new Date(year, month + 1, 0);
        // 获取当月第一天是星期几
        const startDay = firstDay.getDay();
        // 获取当月的天数
        const daysInMonth = lastDay.getDate();
        
        // 获取上个月的最后一天
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        
        // 清空日历
        $('#calendarDays').empty();
        
        // 添加上个月的日期
        for (let i = startDay; i > 0; i--) {
            const day = prevMonthLastDay - i + 1;
            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const isChecked = checkins[dateStr] === true;
            const dayElement = $('<div>').addClass('calendar-day other-month').text(day);
            if (isChecked) {
                dayElement.addClass('checked');
            }
            $('#calendarDays').append(dayElement);
        }
        
        // 添加当月的日期
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
            const isChecked = checkins[dateStr] === true;
            const isToday = isSameDay(new Date(year, month, i), new Date());
            const dayElement = $('<div>').addClass('calendar-day').text(i);
            
            if (isToday) {
                dayElement.addClass('today');
            }
            if (isChecked) {
                dayElement.addClass('checked');
            }
            
            // 添加点击事件
            dayElement.click(function() {
                // 检查是否是当天日期
                const selectedDate = new Date(dateStr);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                selectedDate.setHours(0, 0, 0, 0);
                
                if (isSameDay(selectedDate, today)) {
                    // 当天日期，启用打卡按钮
                    $('#checkinBtn').removeClass('disabled').prop('disabled', false);
                } else {
                    // 其他日期，禁用打卡按钮，启用补签功能
                    $('#checkinBtn').addClass('disabled').prop('disabled', true);
                    // 显示补签选择
                    toggleCheckin(dateStr, $(this));
                }
            });
            
            $('#calendarDays').append(dayElement);
        }
        
        // 计算并更新统计信息
        updateStats(year, month);
    }
    
    // 切换打卡状态（改为补签功能）
    function toggleCheckin(dateStr, element) {
        const selectedDate = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);
        
        // 只能补签过去的日期，不能补签未来的日期
        if (selectedDate > today) {
            alert('签到失败!!请勿签到未来的日期');
            return;
        }
        
        // 当天的日期通过打卡按钮处理，这里只处理补签
        if (isSameDay(selectedDate, today)) {
            alert('请使用打卡按钮进行当天打卡！');
            return;
        }
        
        // 计算前一天的日期
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        
        // 只能补签前一天的日期
        if (!isSameDay(selectedDate, yesterday)) {
            alert('只能补签前一天的日期！');
            return;
        }
        
        // 检查是否已经打卡
        if (checkins[dateStr]) {
            alert('该日期已经打卡过了！');
            return;
        }
        
        // 显示补签模态框，让用户选择环保行为
        $('#checkinModal').modal('show');
        $('#checkinModalLabel').text('补签 - ' + dateStr);
        
        // 保存当前补签的日期和元素
        window.currentCheckinDate = dateStr;
        window.currentCheckinElement = element;
    }
    
    // 处理打卡
    function handleCheckin() {
        // 判断是当天打卡还是补签
        const isMakeup = window.currentCheckinDate !== undefined;
        const dateStr = isMakeup ? window.currentCheckinDate : `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${new Date().getDate().toString().padStart(2, '0')}`;
        const element = window.currentCheckinElement;
        
        // 检查是否已经打卡
        if (checkins[dateStr]) {
            showFeedback('该日期已经打卡过了！', 'success');
            $('#checkinModal').modal('hide');
            return;
        }
        
        // 获取选中的行为
        const selectedBehavior = $('input[name="behavior"]:checked').val();
        
        // 检查是否选择了行为
        if (!selectedBehavior) {
            showFeedback('请选择一个环保行为！', 'error');
            return;
        }
        
        // 获取自定义行为
        let behavior = selectedBehavior;
        if (selectedBehavior === '其他') {
            const customBehavior = $('#customBehavior').val().trim();
            if (!customBehavior) {
                showFeedback('请输入其他环保行为！', 'error');
                return;
            }
            behavior = customBehavior;
        }
        
        // 计算积分：当天打卡5分，补签2分
        const pointsEarned = isMakeup ? 2 : 5;
        
        // 发送打卡数据到后端API
        axios.post('http://localhost:3000/api/checkin', {
            user_id: currentUserId,
            checkin_date: dateStr,
            preset_behaviors: selectedBehavior,
            custom_behavior: selectedBehavior === '其他' ? behavior : null,
            points_earned: pointsEarned
        })
        .then(response => {
            if (response.data.success) {
                console.log('打卡数据同步到数据库成功');
                // 更新本地打卡记录
                checkins[dateStr] = true;
                // 如果是补签，更新日历显示
                if (isMakeup && element) {
                    element.addClass('checked');
                }
                // 从数据库获取最新积分
                fetchUserInfo(currentUserId);
            } else {
                console.error('打卡数据同步到数据库失败:', response.data.message);
            }
        })
        .catch(error => {
            console.error('打卡数据同步到数据库时发生错误:', error);
        });
        
        // 显示反馈
        showFeedback(`恭喜你，${isMakeup ? '补签' : '打卡'}成功，积分+${pointsEarned}`, 'success');
        
        // 关闭模态框
        setTimeout(function() {
            $('#checkinModal').modal('hide');
            // 清除补签状态
            delete window.currentCheckinDate;
            delete window.currentCheckinElement;
        }, 1500);
        
        // 更新日历和统计信息
        renderCalendar(currentDate);
        updateUserStats();
        // 更新历史打卡记录
        showHistory();
        
        // 清空选择
        $('input[name="behavior"]').prop('checked', false);
        $('#customBehavior').val('').hide();
    }
    
    // 显示反馈
    function showFeedback(message, type) {
        const feedbackElement = $('#checkinFeedback');
        feedbackElement.text(message);
        feedbackElement.removeClass('success error');
        feedbackElement.addClass(type === 'success' ? 'success' : 'error');
        feedbackElement.show();
        
        // 3秒后隐藏
        setTimeout(function() {
            feedbackElement.hide();
        }, 3000);
    }
    
    // 更新统计信息
    function updateStats(year, month) {
        // 计算本月打卡次数
        let monthlyCheckins = 0;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
            if (checkins[dateStr]) {
                monthlyCheckins++;
            }
        }
        
        // 计算连续打卡天数
        let consecutiveCheckins = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let currentDate = new Date(today);
        
        while (true) {
            const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
            if (checkins[dateStr]) {
                consecutiveCheckins++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }
        
        // 更新统计信息显示
        $('#monthlyCheckins').text(monthlyCheckins);
        $('#consecutiveCheckins').text(consecutiveCheckins);
    }
    
    // 更新用户统计信息
    function updateUserStats() {
        // 从数据库查询所有打卡记录的积分总和
        axios.get(`http://localhost:3000/api/checkin/user/${currentUserId}`)
        .then(response => {
            if (response.data.success) {
                const records = response.data.data;
                // 计算所有打卡记录的积分总和
                const totalPoints = records.reduce((sum, record) => sum + record.points_earned, 0);
                $('#totalPoints').text(totalPoints);
            }
        })
        .catch(error => {
            console.error('获取打卡记录失败:', error);
        });
    }
    
    // 显示历史打卡记录
    function showHistory() {
        const historyList = $('#historyList');
        historyList.empty();
        
        // 从数据库获取打卡记录
        axios.get(`http://localhost:3000/api/checkin/user/${currentUserId}`)
        .then(response => {
            if (response.data.success) {
                const records = response.data.data;
                
                if (records.length === 0) {
                    historyList.append('<div class="history-item">暂无打卡记录</div>');
                    return;
                }
                
                // 只显示最近10条记录
                const recentRecords = records.slice(0, 10);
                
                recentRecords.forEach(record => {
                    const date = new Date(record.checkin_date);
                    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
                    const dayOfWeek = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
                    
                    const historyItem = $('<div>').addClass('history-item');
                    historyItem.html(`
                        <div class="history-date">${formattedDate}</div>
                        <div class="history-weekday">星期${dayOfWeek}</div>
                        <div class="history-behavior">${record.preset_behaviors}${record.custom_behavior ? ' - ' + record.custom_behavior : ''}</div>
                        <div class="history-points">+${record.points_earned}分</div>
                        <button class="delete-record-btn" data-id="${record.id}" data-date="${record.checkin_date}">删除</button>
                    `);
                    
                    historyList.append(historyItem);
                });
                
                // 添加删除按钮事件监听
                $('.delete-record-btn').click(function() {
                    const recordId = $(this).data('id');
                    const recordDate = $(this).data('date');
                    const button = $(this);
                    
                    if (confirm('确定要删除这条打卡记录吗？')) {
                        // 发送删除请求到后端API
                        axios.delete(`http://localhost:3000/api/checkin/${recordId}`)
                        .then(response => {
                            if (response.data.success) {
                                console.log('删除打卡记录成功');
                                // 更新本地打卡记录
                                // 确保使用正确的日期格式
                                const date = new Date(recordDate);
                                const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
                                delete checkins[dateStr];
                                // 更新日历和统计信息
                                renderCalendar(currentDate);
                                updateUserStats();
                                // 更新历史打卡记录
                                showHistory();
                                alert('删除成功！');
                            } else {
                                console.error('删除打卡记录失败:', response.data.message);
                                alert('删除失败：' + response.data.message);
                            }
                        })
                        .catch(error => {
                            console.error('删除打卡记录时发生错误:', error);
                            alert('删除失败：网络错误');
                        });
                    }
                });
            } else {
                console.error('获取打卡记录失败:', response.data.message);
                historyList.append('<div class="history-item">获取打卡记录失败</div>');
            }
        })
        .catch(error => {
            console.error('获取打卡记录时发生错误:', error);
            historyList.append('<div class="history-item">获取打卡记录失败</div>');
        });
    }
    
    // 清空历史记录按钮点击事件
    $('#clearHistoryBtn').click(function() {
        if (confirm('确定要清空所有打卡历史记录吗？此操作不可恢复！')) {
            // 重置checkins变量
            checkins = {};
            // 更新日历、统计信息和历史记录
            renderCalendar(currentDate);
            updateUserStats();
            showHistory();
            alert('历史记录已清空！');
        }
    });
    
    // 上传头像功能
    $('#uploadAvatarBtn').click(function() {
        $('#avatarFileInput').click();
    });
    
    $('#avatarFileInput').change(function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // 检查文件类型
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert('请选择图片文件（JPEG、PNG、GIF、WebP）');
            return;
        }
        
        // 检查文件大小（最大5MB）
        if (file.size > 5 * 1024 * 1024) {
            alert('图片大小不能超过5MB');
            return;
        }
        
        const formData = new FormData();
        formData.append('avatar', file);
        
        // 显示加载状态
        $('#uploadAvatarBtn').text('上传中...').prop('disabled', true);
        
        // 发送上传请求
        axios.post(`http://localhost:3000/api/user/${currentUserId}/upload-avatar`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        .then(response => {
            if (response.data.success) {
                console.log('头像上传成功');
                // 更新头像显示
                $('#currentAvatar').attr('src', response.data.avatarUrl + '?' + new Date().getTime());
                alert('头像上传成功！');
            } else {
                console.error('头像上传失败:', response.data.message);
                alert('头像上传失败：' + response.data.message);
            }
        })
        .catch(error => {
            console.error('头像上传时发生错误:', error);
            alert('头像上传失败：网络错误');
        })
        .finally(() => {
            // 恢复按钮状态
            $('#uploadAvatarBtn').text('上传头像').prop('disabled', false);
            // 清空文件输入
            $('#avatarFileInput').val('');
        });
    });
    
    // 判断两个日期是否是同一天
    function isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    // 添加事件监听器
$('#goToCurrentMonth').click(function() {
    const today = new Date();
    currentDate.setFullYear(today.getFullYear());
    currentDate.setMonth(today.getMonth());
    renderCalendar(currentDate);
});

});
// 注册页前端交互：发送验证码+提交注册
$(function() {
  let isCounting = false; // 防止重复发送验证码

  // 1. 发送验证码按钮点击事件
  $('#sendCodeBtn').click(async function() {
    if (isCounting) return; // 倒计时中禁止点击
    const email = $('#signup-email').val().trim();

    // 前端校验邮箱格式
    const emailReg = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
    if (!email || !emailReg.test(email)) {
      alert('请输入正确的邮箱格式');
      return;
    }

    // 调用发送验证码接口
    try {
      const res = await $.ajax({
        url: '/api/send-register-code',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ email })
      });
      if (res.success) {
        alert(res.message);
        startCountdown(); // 启动60秒倒计时
      } else {
        alert(res.message);
      }
    } catch (error) {
      alert('网络异常，请重试');
    }
  });

  // 2. 提交注册按钮点击事件
  $('#registerBtn').click(async function() {
    const username = $('#signup-username').val().trim();
    const email = $('#signup-email').val().trim();
    const password = $('#signup-password').val().trim();
    const code = $('#signup-code').val().trim();

    // 前端基础校验
    if (!username) { alert('请输入用户名'); return; }
    if (!password || password.length < 6) { alert('密码至少6位'); return; }
    if (!code) { alert('请输入验证码'); return; }

    // 调用注册接口
    try {
      const res = await $.ajax({
        url: '/api/register',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
          username, email, password, code
        })
      });
      if (res.success) {
        alert(res.message);
        window.location.href = 'login.html'; // 跳转到登录页
      } else {
        alert(res.message);
      }
    } catch (error) {
      alert('注册失败，请重试');
    }
  });

  // 验证码倒计时函数
  function startCountdown() {
    isCounting = true;
    let count = 60;
    const $btn = $('#sendCodeBtn');
    $btn.prop('disabled', true).text(`重新发送(${count}s)`);
    
    const timer = setInterval(() => {
      count--;
      $btn.text(`重新发送(${count}s)`);
      if (count <= 0) {
        clearInterval(timer);
        isCounting = false;
        $btn.prop('disabled', false).text('发送验证码');
      }
    }, 1000);
  }
});
});
 function initPageState() {
        $('#challenge-nav-item').addClass('active').siblings().removeClass('active');
        setTimeout(function() {
            var preloader = document.querySelector('.preloader');
            if (preloader) {
                preloader.style.opacity = '0';
                setTimeout(function() {
                    preloader.style.display = 'none';
                }, 300);
            }
        }, 500);
    }

    // ========== 【Supabase配置和题库读取】 ==========
    // Supabase配置（请根据实际情况修改URL和anon key）
    const supabaseUrl = 'https://cvpjfjpcwyujcnwmnpci.supabase.co';
    const supabaseKey = 'sb_publishable_2tB607BQXYyTDmoYSXfjag_TLRsZkWo';
   const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
    
    // 全局变量
    let quizDatabase = [];
    let allQuestions = []; // 存储所有题目
    
    // 从数据库读取题目
    async function loadQuestionsFromDatabase() {
        try {
            // 从三个表中读取所有题目
            const { data: singleQuestions, error: singleError } = await supabaseClient
                .from('single_choice')
                .select('*');
            
            const { data: multipleQuestions, error: multipleError } = await supabaseClient
                .from('multiple_choice')
                .select('*');
            
           const { data: trueFalseQuestions, error: trueFalseError } = await supabaseClient
                .from('true_false')
                .select('*');
            
            if (singleError || multipleError || trueFalseError) {
                console.error('读取题目失败:', singleError, multipleError, trueFalseError);
                alert('读取题目失败，请检查数据库连接');
                return;
            }
            
            // 合并所有题目
            allQuestions = [];
            
            // 处理单选题
            if (singleQuestions) {
                singleQuestions.forEach(q => {
                    allQuestions.push({
                        id: q.id,
                        type: 'single',
                        question: q.title,
                        options: [q.option_a, q.option_b, q.option_c, q.option_d],
                        answer: q.answer // 直接使用数据库中的答案
                    });
                });
            }
            
            // 处理多选题
            if (multipleQuestions) {
                multipleQuestions.forEach(q => {
                    allQuestions.push({
                        id: q.id,
                        type: 'multiple',
                        question: q.title,
                        options: [q.option_a, q.option_b, q.option_c, q.option_d],
                        answer: q.answer // 直接使用数据库中的答案
                    });
                });
            }
            
            // 处理判断题
            if (trueFalseQuestions) {
                trueFalseQuestions.forEach(q => {
                    allQuestions.push({
                        id: q.id,
                        type: 'true_false',
                        question: q.title,
                        options: ['√', '×'], // 判断题显示√和×
                        answer: q.answer // 直接使用数据库中的答案
                    });
                });
            }
            
            console.log('成功读取题目:', allQuestions.length, '题');
            
        } catch (error) {
            console.error('加载题目时发生错误:', error);
            alert('加载题目失败，请重试');
        }
    }
    
    // 随机抽取题目
    function randomizeQuestions(count = 1) {
        const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
        quizDatabase = shuffled.slice(0, count);
    }
    // ========== 【题库配置结束】 ==========

    // 排名数据（自动生成，无需修改）
    let rankingDatabase = [
        { name: "环保先锋1号", score: 50 },
        { name: "绿色使者", score: 40 },
        { name: "低碳达人", score: 30 }
    ];

    // 答题状态变量
    let currentQuestionIndex = 0;
    let userAnswers = [];
    let isAnswering = false;

    // 测试
    function checkTodayAnswered() {
    return false; // 永远返回“未答题”，随便测多少次都行
}
    
    // 记录今日已答题
    function recordTodayAnswered() {
    const today = new Date().toISOString().split('T')[0];
    // 用用户ID做键，每个用户独立记录
    localStorage.setItem(`lastQuizDate_${currentUserId}`, today);
}
    
    // 初始化答题界面（新增：清空当前用户旧成绩）
    function initQuiz() {
    // 🔥 关键：确保用当前登录用户的ID，避免串号
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    currentUserId = currentUser ? currentUser.id : '';

    // 清空当前用户的旧排名记录，避免重复
    rankingDatabase = rankingDatabase.filter(item => item.name !== '当前用户');
    currentQuestionIndex = 0;
    userAnswers = [];
    isAnswering = false;
    
    // 检查是否今日已答题
    if (checkTodayAnswered()) {
        $('#quiz-question').text("今日已完成答题，明日再来！");
        $('#quiz-options').empty();
        $('#quiz-progress-bar').css('width', '0%');
        $('#start-quiz').hide();
        $('#next-question').hide();
        $('#submit-quiz').hide();
        $('#quiz-result').hide();
        $('#restart-quiz').hide();
    } else {
        $('#quiz-question').text("请点击'开始答题'按钮开始挑战");
        $('#quiz-options').empty();
        $('#quiz-progress-bar').css('width', '0%');
        $('#start-quiz').show();
        $('#next-question').hide();
        $('#submit-quiz').hide();
        $('#quiz-result').hide();
        $('#restart-quiz').hide();
    }
}

    // 加载当前题目
    function loadCurrentQuestion() {
        if (currentQuestionIndex >= quizDatabase.length) {
            submitQuiz();
            return;
        }

        const currentQuestion = quizDatabase[currentQuestionIndex];
        $('#quiz-question').text(`${currentQuestionIndex + 1}. ${currentQuestion.question}`);
        
        let optionsHtml = '';
        currentQuestion.options.forEach((option, index) => {
            optionsHtml += `<li class="quiz-option" data-index="${index}">${String.fromCharCode(65 + index)}. ${option}</li>`;
        });
        $('#quiz-options').html(optionsHtml);
        
        const progress = ((currentQuestionIndex + 1) / quizDatabase.length) * 100;
        $('#quiz-progress-bar').css('width', `${progress}%`);
        
        // 根据题目类型设置不同的点击事件
        if (currentQuestion.type === 'multiple') {
            // 多选题：允许多选
            $('.quiz-option').click(function() {
                if (!isAnswering) return;
                $(this).toggleClass('selected');
            });
        } else {
            // 单选题和判断题：单选
            $('.quiz-option').click(function() {
                if (!isAnswering) return;
                $('.quiz-option').removeClass('selected');
                $(this).addClass('selected');
            });
        }
        
        $('#start-quiz').hide();
        if (currentQuestionIndex === quizDatabase.length - 1) {
            $('#next-question').hide();
            $('#submit-quiz').show();
        } else {
            $('#next-question').show();
            $('#submit-quiz').hide();
        }
    }

    // 检查答案
   // 检查答案（最终修复版，兼容所有题型）
function checkAnswer() {
    const selectedOptions = $('.quiz-option.selected');
    if (!selectedOptions.length) {
        alert('请选择一个选项！');
        return false;
    }

    const currentQuestion = quizDatabase[currentQuestionIndex];
    let isCorrect = false;
    
    if (currentQuestion.type === 'multiple') {
        // 多选题：比较选中的选项集合
        const selectedIndices = [];
        selectedOptions.each(function() {
            selectedIndices.push(parseInt($(this).data('index')));
        });
        
        // 强制转字符串再分割，避免数字无法split
        const correctIndices = String(currentQuestion.answer).split(',').map(idx => parseInt(idx));
        
        // 检查选中的选项是否与正确答案完全匹配
        isCorrect = selectedIndices.length === correctIndices.length && 
                   selectedIndices.every(idx => correctIndices.includes(idx));
        
        userAnswers.push({
            questionId: currentQuestion.id,
            selectedIndices: selectedIndices,
            isCorrect: isCorrect
        });
        
        // 标记正确和错误的选项
        $('.quiz-option').each(function(index) {
            const isSelected = selectedIndices.includes(index);
            const isCorrectOption = correctIndices.includes(index);
            
            if (isCorrectOption) {
                $(this).addClass('correct');
            } else if (isSelected) {
                $(this).addClass('incorrect');
            }
            $(this).off('click');
        });
        
    } else {
        // 单选题和判断题：单选（兼容数字、√/×两种答案格式）
        const selectedIndex = parseInt(selectedOptions.data('index'));
        // 判断题特殊处理：如果答案是√/×，转成对应下标
        let correctIndex;
        if (currentQuestion.answer === '√') {
            correctIndex = 0;
        } else if (currentQuestion.answer === '×') {
            correctIndex = 1;
        } else {
            // 单选题用数字下标
            correctIndex = parseInt(currentQuestion.answer);
        }
        isCorrect = selectedIndex === correctIndex;
        
        userAnswers.push({
            questionId: currentQuestion.id,
            selectedIndex: selectedIndex,
            isCorrect: isCorrect
        });
        
        // 标记正确和错误的选项（用correctIndex，彻底解决NaN问题）
        $('.quiz-option').each(function(index) {
            if (index === correctIndex) {
                $(this).addClass('correct');
            } else if (index === selectedIndex && index !== correctIndex) {
                $(this).addClass('incorrect');
            }
            $(this).off('click');
        });
    }
    
    return true;
}

    // 提交答题
    function submitQuiz() {
        const correctCount = userAnswers.filter(answer => answer.isCorrect).length;
        const totalScore = correctCount * 10;
        const totalQuestions = quizDatabase.length;
        
        $('#result-score').text(`总得分：${totalScore}分（${correctCount}/${totalQuestions}题正确）`);
        $('#result-desc').text(`恭喜你完成答题，获得${totalScore}绿色积分！`);
        
        $('#next-question').hide();
        $('#submit-quiz').hide();
        $('#quiz-result').show();
        $('#restart-quiz').hide(); // 隐藏重新答题按钮
        
        // 记录今日已答题
        recordTodayAnswered();
        
        updateRanking('当前用户', totalScore);
        isAnswering = false;
    }

    // 更新排名（优化：同一用户只保留最高分）
    function updateRanking(username, score) {
        // 查找当前用户是否已有记录
        const userIndex = rankingDatabase.findIndex(item => item.name === username);

        if (userIndex !== -1) {
            // 用户已存在：只更新更高分
            if (score > rankingDatabase[userIndex].score) {
                rankingDatabase[userIndex].score = score;
            }
        } else {
            // 用户不存在：新增
            rankingDatabase.push({ name: username, score: score });
        }

        // 按分数降序排序
        rankingDatabase.sort((a, b) => b.score - a.score);

        // 只保留前10名
        if (rankingDatabase.length > 10) {
            rankingDatabase = rankingDatabase.slice(0, 10);
        }

        // 存入本地存储
        localStorage.setItem('quizRanking', JSON.stringify(rankingDatabase));
    }

    // 渲染排名
    function renderRanking() {
        const savedRanking = localStorage.getItem('quizRanking');
        if (savedRanking) {
            rankingDatabase = JSON.parse(savedRanking);
        }
        
        let rankingHtml = '';
        rankingDatabase.forEach((item, index) => {
            const isTop3 = index < 3;
            let rankIcon = '';
            if (index === 0) rankIcon = '<i class="fa fa-trophy" style="color: #ffd700;"></i>';
            else if (index === 1) rankIcon = '<i class="fa fa-trophy" style="color: #c0c0c0;"></i>';
            else if (index === 2) rankIcon = '<i class="fa fa-trophy" style="color: #cd7f32;"></i>';
            else rankIcon = index + 1;
            
            rankingHtml += `
                <li class="ranking-item ${isTop3 ? 'top3' : ''}">
                    <div class="ranking-rank">${rankIcon}</div>
                    <div class="ranking-name">${item.name}</div>
                    <div class="ranking-score">${item.score}分</div>
                </li>
            `;
        });
        
        $('#ranking-list').html(rankingHtml);
        $('#ranking-card').show();
    }

    // 页面加载事件
    $(document).ready(function() {
    initPageState();

    // 先加载题目 → 加载完才能点开始答题
    loadQuestionsFromDatabase().then(() => {
        initQuiz();
        window.questionsLoaded = true; // 加一个标记
    });
        
        // 答题按钮事件
        $('#start-quiz').click(async function() {
    // 必须等题目加载完
    if (!window.questionsLoaded) {
        alert('题目正在加载中，请稍等...');
        return;
    }

    // 检查是否有题目
    if (allQuestions.length === 0) {
        alert('暂无答题题目，请管理员添加题目后再试！');
        return;
    }
            
            // 随机抽取题目
            randomizeQuestions(1);
            
            isAnswering = true;
            loadCurrentQuestion();
        });

        $('#next-question').click(function() {
            if (checkAnswer()) {
                currentQuestionIndex++;
                loadCurrentQuestion();
            }
        });

        $('#submit-quiz').click(function() {
            if (checkAnswer()) {
                submitQuiz();
            }
        });

        $('#restart-quiz').click(function() {
            initQuiz();
        });

        $('#view-ranking').click(function() {
            renderRanking();
            $('html, body').animate({
                scrollTop: $('#ranking-card').offset().top - 100
            }, 500);
        });

        $('#hide-ranking').click(function() {
            $('#ranking-card').hide();
        });
    });

    window.onload = function() {
        initPageState();
    };