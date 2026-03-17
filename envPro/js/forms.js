$(document).ready(function() {
    // ===================== 左侧图片自动切换逻辑 =====================
    const imageSet = [
        'images/slider/1.jpg',
        'images/slider/2.jpg',
        'images/slider/3.jpg',
        'images/slider/4.jpg',
        'images/slider/5.jpg',
        'images/slider/6.jpg'
    ];
    let currentImageIndex = 0;
    const bgContainer = $('#bgImageContainer');
    const autoSwitchInterval = 5000;
    let autoSwitchTimer;

    function switchToImage(index) {
        currentImageIndex = index;
        bgContainer.css({
            'background-image': `url(${imageSet[currentImageIndex]})`,
            'background-size': 'cover',
            'background-position': 'center'
        });
        console.log(`当前显示第 ${currentImageIndex + 1} 张图：${imageSet[currentImageIndex]}`);
    }

    function autoSwitchNextImage() {
        const nextIndex = (currentImageIndex + 1) % imageSet.length;
        switchToImage(nextIndex);
    }

    function startAutoSwitch() {
        stopAutoSwitch();
        autoSwitchTimer = setInterval(autoSwitchNextImage, autoSwitchInterval);
    }

    function stopAutoSwitch() {
        if (autoSwitchTimer) {
            clearInterval(autoSwitchTimer);
            autoSwitchTimer = null;
        }
    }

    switchToImage(currentImageIndex);
    startAutoSwitch();

    // ===================== 标签切换核心逻辑 =====================
    $('.tab-menu a').on('click', function(e) {
        e.preventDefault();
        var tab = $(this).attr('data-tab');
        $('.tab-menu li').removeClass('active');
        $('.tab-content-inner').removeClass('active');
        $(this).parent('li').addClass('active');
        $('.tab-content-inner[data-content="' + tab + '"]').addClass('active');
    });

    // ===================== 找回密码按钮逻辑 =====================
    $('.find-pwd-btn').on('click', function() {
        $('.tab-menu li:has(a[data-tab="refind"])').show();
        $('.tab-menu a[data-tab="refind"]').trigger('click');
    });

    // ===================== 手机号验证工具函数 =====================
    function validatePhone(phone) {
        const phoneReg = /^1\d{10}$/;
        return phoneReg.test(phone);
    }

    // ===================== 注册表单逻辑（新增后端请求） =====================
    let signupCountdown = 60;
    let signupTimer = null;
    let signupCode = '';
    let isSignupCodeSending = false;

    // 发送验证码按钮点击事件
    $('#sendCodeBtn').on('click', function() {
        if (isSignupCodeSending) return;
        const email = $('#signup-email').val().trim();
        
        // 前端校验邮箱格式
        const emailReg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!email || !emailReg.test(email)) {
            alert('请输入正确的邮箱格式');
            return;
        }

        isSignupCodeSending = true;
        $(this).prop('disabled', true).text('发送中...');

        // 调用后端发送验证码接口
        fetch('http://localhost:3000/api/user/send-register-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email })
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert(result.message || '验证码发送成功，请查收邮箱');
                // 启动倒计时
                startSignupCountdown();
            } else {
                alert(result.message || '验证码发送失败');
                $(this).prop('disabled', false).text('发送验证码');
                isSignupCodeSending = false;
            }
        })
        .catch(error => {
            console.error('发送验证码请求失败：', error);
            alert('网络异常，发送失败');
            $(this).prop('disabled', false).text('发送验证码');
            isSignupCodeSending = false;
        });
    });

    // 启动倒计时
    function startSignupCountdown() {
        signupCountdown = 60;
        const $btn = $('#sendCodeBtn');
        $btn.text(`重新发送(${signupCountdown}s)`);
        
        signupTimer = setInterval(function() {
            signupCountdown--;
            $btn.text(`重新发送(${signupCountdown}s)`);
            
            if (signupCountdown <= 0) {
                clearInterval(signupTimer);
                $btn.prop('disabled', false).text('发送验证码');
                isSignupCodeSending = false;
            }
        }, 1000);
    }

    // 注册提交（核心修改：新增向后端发送请求）
    $('#signupForm').on('submit', async function(e) { // 加async支持await
        e.preventDefault();
        const username = $('#signup-username').val().trim();
        const phone = $('#signup-phone').val().trim();
        const email = $('#signup-email').val().trim();
        const code = $('#signup-code').val().trim();
        const pwd = $('#signup-password').val().trim();
        const pwd2 = $('#signup-password2').val().trim();

        // 前端校验（保留原有逻辑）
        if (!username) { alert('请填写用户名！'); return; }
        if (!phone) { alert('请填写手机号！'); return; }
        if (!validatePhone(phone)) {
            alert('请输入有效的11位手机号！');
            $('#signup-phone').focus();
            return;
        }
        if (!email) { alert('请填写邮箱！'); return; }
        const emailReg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!emailReg.test(email)) { alert('邮箱格式错误！'); return; }
        if (!code) { alert('请填写验证码！'); return; }
        if (!pwd) { alert('请填写密码！'); return; }
        if (pwd !== pwd2) { alert('两次密码不一致！'); return; }

        try {
            // 禁用注册按钮，防止重复提交
            $('#signupForm button[type="submit"]').prop('disabled', true).text('注册中...');
            
            // 核心新增：向后端发送注册请求
            const response = await fetch('http://localhost:3000/api/user/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', // 告诉后端是JSON格式
                },
                body: JSON.stringify({ // 组装要传递的参数
                    username: username,
                    phone: phone,
                    email: email,
                    code: code, // 验证码
                    password: pwd // 注意：后端接收的参数名要和这里一致
                })
            });

            // 解析后端返回的结果
            const result = await response.json();
            if (result.success) {
                // 后端返回成功（数据已写入数据库）
                alert(`注册成功！用户名：${username}，手机号：${phone}`);
                // 切换到登录表单 + 重置表单
                $('.tab-menu a[data-tab="login"]').trigger('click');
                $(this)[0].reset();
            } else {
                // 后端返回失败（比如用户名已存在）
                alert('注册失败：' + result.message);
            }
        } catch (error) {
            // 网络错误/后端服务未启动
            console.error('注册请求失败：', error);
            alert('注册失败！请检查后端服务是否启动（http://localhost:3000）');
        } finally {
            // 重新启用注册按钮
            $('#signupForm button[type="submit"]').prop('disabled', false).text('注册');
        }
    });

    // ===================== 登录表单逻辑（新增后端请求） =====================
    $('#loginForm').on('submit', async function(e) {
        e.preventDefault();
        const username = $('#login-username').val().trim();
        const pwd = $('#login-password').val().trim();

        if (!username || !pwd) {
            alert('请填写用户名和密码！');
            return;
        }

        try {
            // 发送登录请求到后端
            const response = await fetch('http://localhost:3000/api/user/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: pwd
                })
            });

            const result = await response.json();
            if (result.success) {
                // 登录成功，将用户信息存储到localStorage
                localStorage.setItem('currentUser', JSON.stringify(result.user));
                alert('登录成功！即将跳转到首页');
                window.location.href = 'index.html';
            } else {
                alert('登录失败：' + result.message);
                $('#login-password').val('');
            }
        } catch (error) {
    // 打印完整错误信息到控制台（F12能看到）
    console.error('登录请求失败详情：', error);
    // 弹窗提示具体错误（比如404/跨域/500）
    let errorMsg = '登录失败！';
    if (error.message.includes('404')) {
        errorMsg += '接口地址错误，请检查后端接口路径';
    } else if (error.message.includes('CORS')) {
        errorMsg += '跨域问题，请配置后端跨域';
    } else if (error.message.includes('500')) {
        errorMsg += '后端接口报错，请查看后端控制台';
    } else {
        errorMsg += '请检查后端服务是否启动';
    }
    alert(errorMsg);
}
    });

    // ===================== 找回密码表单逻辑 =====================
    $('#refindForm').on('submit', function(e) {
        e.preventDefault();
        const username = $('#refind-username').val();
        const email = $('#refind-email').val();
        const code = $('#refind-captcha').val();

        if (!code) { alert('请填写验证码！'); return; }
        if (code !== '8888') {
            alert('验证码错误（测试专用：8888）！');
            $('#refind-captcha').val('');
            return;
        }

        alert(`admin用户密码找回成功！新密码已发送至邮箱${email}（测试提示：新密码为admin888）`);
        $('.tab-menu a[data-tab="login"]').trigger('click');
        $(this)[0].reset();
    });

    // ===================== 实时验证逻辑 =====================
    
    // 检查字段唯一性的函数
    function checkFieldExistence(type, value, validationElement) {
        // 如果值为空，清空验证提示
        if (!value.trim()) {
            validationElement.text('').removeClass('valid invalid');
            return;
        }
        
        // 构建请求URL
        const url = `http://localhost:3000/api/user/check-existence?type=${type}&value=${encodeURIComponent(value)}`;
        
        // 发送AJAX请求
        fetch(url)
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    if (result.data.exists) {
                        // 字段已存在
                        validationElement.text(type === 'username' ? '用户名不可用' : type === 'phone' ? '手机号已被注册' : '邮箱已被注册').removeClass('valid').addClass('invalid');
                    } else {
                        // 字段可用
                        validationElement.text(type === 'username' ? '该用户名可用' : type === 'phone' ? '该手机号可用' : '该邮箱可用').removeClass('invalid').addClass('valid');
                    }
                } else {
                    // 请求失败，显示错误信息
                    validationElement.text('验证失败：' + result.message).removeClass('valid').addClass('invalid');
                }
            })
            .catch(error => {
                // 网络错误
                validationElement.text('网络错误，请稍后重试').removeClass('valid').addClass('invalid');
                console.error('检查字段存在性请求失败：', error);
            });
    }
    
    // 为用户名输入框添加实时验证
    $('#signup-username').on('input', function() {
        const username = $(this).val();
        const validationElement = $('#username-validation');
        checkFieldExistence('username', username, validationElement);
    });
    
    // 为手机号输入框添加实时验证
    $('#signup-phone').on('input', function() {
        const phone = $(this).val();
        const validationElement = $('#phone-validation');
        // 先验证手机号格式
        if (!validatePhone(phone) && phone.length > 0) {
            validationElement.text('请输入有效的11位手机号').removeClass('valid').addClass('invalid');
            return;
        }
        // 格式正确时检查唯一性
        if (validatePhone(phone)) {
            checkFieldExistence('phone', phone, validationElement);
        } else {
            validationElement.text('').removeClass('valid invalid');
        }
    });
    
    // 为邮箱输入框添加实时验证
    $('#signup-email').on('input', function() {
        const email = $(this).val();
        const validationElement = $('#email-validation');
        // 先验证邮箱格式
        const emailReg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!emailReg.test(email) && email.length > 0) {
            validationElement.text('邮箱格式错误').removeClass('valid').addClass('invalid');
            return;
        }
        // 格式正确时检查唯一性
        if (emailReg.test(email)) {
            checkFieldExistence('email', email, validationElement);
        } else {
            validationElement.text('').removeClass('valid invalid');
        }
    });

    // ===================== 忘记密码弹窗逻辑 =====================
    let resetCountdown = 60;
    let resetTimer = null;
    let resetCode = '';
    let isResetCodeSending = false;
    let currentUserEmail = '';

    // 点击忘记密码链接显示弹窗
    $('#forgotPasswordLink').on('click', function() {
        $('#forgotPasswordModal').modal('show');
        // 重置弹窗到第一步
        resetPasswordModalToStep1();
    });

    // 弹窗关闭时重置
    $('#forgotPasswordModal').on('hidden.bs.modal', function() {
        resetPasswordModalToStep1();
    });

    // 重置弹窗到第一步
    function resetPasswordModalToStep1() {
        // 显示第一步，隐藏其他步骤
        $('.reset-step').hide();
        $('#step1').show();
        
        // 重置所有输入和验证信息
        $('#reset-email').val('');
        $('#reset-code').val('');
        $('#new-password').val('');
        $('#confirm-password').val('');
        $('.validation-message').text('').hide();
        
        // 重置状态变量
        currentUserEmail = '';
        resetCode = '';
        
        // 重置验证码按钮
        clearInterval(resetTimer);
        resetCountdown = 60;
        isResetCodeSending = false;
        $('#sendResetCodeBtn').prop('disabled', false).text('发送验证码');
    }

    // 步骤切换：返回第一步
    $('#backToStep1Btn').on('click', function() {
        $('.reset-step').hide();
        $('#step1').show();
    });

    // 步骤切换：返回第二步
    $('#backToStep2Btn').on('click', function() {
        $('.reset-step').hide();
        $('#step2').show();
    });

    // 检查邮箱是否存在
    $('#checkEmailBtn').on('click', function() {
        const email = $('#reset-email').val().trim();
        const validationElement = $('#email-exists-validation');
        
        // 先验证邮箱格式
        const emailReg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!email || !emailReg.test(email)) {
            validationElement.text('请输入正确的邮箱格式').removeClass('valid').addClass('invalid').show();
            return;
        }
        
        // 调用后端检查邮箱是否存在
        fetch('http://localhost:3000/api/user/check-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // 邮箱存在，隐藏验证信息，进入第二步
                validationElement.text('').hide();
                currentUserEmail = email;
                // 显示第二步
                $('.reset-step').hide();
                $('#step2').show();
            } else {
                // 邮箱不存在，显示错误信息
                validationElement.text('该邮箱不存在').removeClass('valid').addClass('invalid').show();
            }
        })
        .catch(error => {
            console.error('检查邮箱失败：', error);
            validationElement.text('网络错误，请稍后重试').removeClass('valid').addClass('invalid').show();
        });
    });

    // 发送重置密码验证码
    $('#sendResetCodeBtn').on('click', function() {
        if (isResetCodeSending) return;
        
        // 调用后端发送验证码接口
        fetch('http://localhost:3000/api/user/send-reset-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: currentUserEmail })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('验证码已发送到您的邮箱，请查收');
                // 开始倒计时
                startResetCountdown();
            } else {
                alert('发送验证码失败：' + data.message);
            }
        })
        .catch(error => {
            console.error('发送验证码失败：', error);
            alert('发送验证码失败，请稍后重试');
        });
    });

    // 开始重置密码验证码倒计时
    function startResetCountdown() {
        isResetCodeSending = true;
        resetCountdown = 60;
        $('#sendResetCodeBtn').prop('disabled', true).text(resetCountdown + '秒后重新发送');
        
        resetTimer = setInterval(function() {
            resetCountdown--;
            if (resetCountdown <= 0) {
                clearInterval(resetTimer);
                isResetCodeSending = false;
                $('#sendResetCodeBtn').prop('disabled', false).text('发送验证码');
            } else {
                $('#sendResetCodeBtn').text(resetCountdown + '秒后重新发送');
            }
        }, 1000);
    }

    // 验证重置密码验证码
    $('#verifyCodeBtn').on('click', function() {
        const code = $('#reset-code').val().trim();
        const validationElement = $('#code-validation');
        
        if (!code) {
            validationElement.text('请输入验证码').removeClass('valid').addClass('invalid').show();
            return;
        }
        
        // 调用后端验证验证码接口
        fetch('http://localhost:3000/api/user/verify-reset-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: currentUserEmail, code: code })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // 验证码正确，隐藏验证信息，进入第三步
                validationElement.text('').hide();
                resetCode = code;
                // 显示第三步
                $('.reset-step').hide();
                $('#step3').show();
            } else {
                // 验证码错误，显示错误信息
                validationElement.text('验证码错误或已过期').removeClass('valid').addClass('invalid').show();
            }
        })
        .catch(error => {
            console.error('验证验证码失败：', error);
            validationElement.text('网络错误，请稍后重试').removeClass('valid').addClass('invalid').show();
        });
    });

    // 重置密码
    $('#resetPasswordBtn').on('click', function() {
        const newPassword = $('#new-password').val().trim();
        const confirmPassword = $('#confirm-password').val().trim();
        const validationElement = $('#password-validation');
        
        // 验证密码格式和一致性
        if (!newPassword || !confirmPassword) {
            validationElement.text('请输入新密码和确认密码').removeClass('valid').addClass('invalid').show();
            return;
        }
        
        if (newPassword !== confirmPassword) {
            validationElement.text('两次输入的密码不一致').removeClass('valid').addClass('invalid').show();
            return;
        }
        
        if (newPassword.length < 6) {
            validationElement.text('密码长度不能少于6位').removeClass('valid').addClass('invalid').show();
            return;
        }
        
        // 调用后端重置密码接口
        fetch('http://localhost:3000/api/user/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: currentUserEmail,
                code: resetCode,
                newPassword: newPassword
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('密码重置成功！');
                window.location.href = 'login.html';
                $('#forgotPasswordModal').modal('hide');
            } else {
                validationElement.text('密码重置失败：' + data.message).removeClass('valid').addClass('invalid').show();
            }
        })
        .catch(error => {
            console.error('重置密码失败：', error);
            validationElement.text('网络错误，请稍后重试').removeClass('valid').addClass('invalid').show();
        });
    });
});