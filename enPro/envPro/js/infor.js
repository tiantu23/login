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
            nicknameInput.val(displayName);
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
        $('#dynamicNumber').text(user.dynamic_count || 0);

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

// 抽离默认数据设置函数，便于复用
function setDefaultUserInfo() {
    $('#usernameText').text('绿色践行者');
    $('#profileName').text('绿色践行者');
    $('#nicknameText').text('未设置昵称');
    $('#emailText').text('green_life@example.com');
    $('#phoneText').text('138****8888');
    $('#birthdayText').text('1990-01-01');
    $('#cityText').text('北京市朝阳区');
    // 动态数量、加入时间和累计减排量
    $('#dynamicNumber').text(0);
    $('#joinTime').text('2026-01-01');
    $('#carbonReduction').text(0);
    // 输入框默认值
    $('#nicknameInput').val('绿色践行者');
    $('#emailInput').val('');
    $('#phoneInput').val('');
    $('#birthdayInput').val('1990-01-01');
    $('#cityInput').val('北京市朝阳区');
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
        const nicknameInput = $('#nicknameInput');
        const updateData = {
            nickname: nicknameInput.length ? nicknameInput.val().trim() || '绿色践行者' : $('#profileName').text().trim() || '绿色践行者',
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
    // 提示用户退出成功
    alert('退出登录成功！');
    // 跳转到登录页面
    window.location.href = 'login.html';
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