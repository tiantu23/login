$(function() {
    // 倒计时状态标记
    let isCounting = false;

    // 1. 发送验证码按钮点击事件
    $("#sendCodeBtn").click(function() {
        if (isCounting) return; // 倒计时中，禁止点击
        const email = $("#signup-email").val().trim();
        // 前端校验邮箱格式
        const emailReg = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
        if (!email || !emailReg.test(email)) {
            alert("请输入正确的邮箱格式");
            return;
        }

        // 调用后端发送验证码接口
        $.ajax({
            url: "/api/send-code",
            type: "POST",
            data: { email: email },
            success: function(res) {
                if (res.success) {
                    alert(res.msg);
                    // 启动倒计时（60秒）
                    startCountdown();
                } else {
                    alert(res.msg);
                }
            },
            error: function() {
                alert("网络异常，发送失败");
            }
        });
    });

    // 2. 登录/注册按钮点击事件（校验验证码）
    $("#submitBtn").click(function() {
        const email = $("#signup-email").val().trim();
        const code = $("#signup-code").val().trim();
        if (!email || !code) {
            alert("请填写邮箱和验证码");
            return;
        }

        // 调用后端校验验证码接口
        $.ajax({
            url: "/api/verify-code",
            type: "POST",
            data: { email: email, code: code },
            success: function(res) {
                if (res.success) {
                    alert("验证成功，即将登录！");
                    // 这里写登录/注册的逻辑（比如提交表单）
                    // $("#loginForm").submit();
                } else {
                    alert(res.msg);
                }
            },
            error: function() {
                alert("网络异常，验证失败");
            }
        });
    });

    // 倒计时函数
    function startCountdown() {
        isCounting = true;
        let count = 60;
        const $btn = $("#sendCodeBtn");
        $btn.prop("disabled", true).text(`重新发送(${count}s)`);
        const timer = setInterval(function() {
            count--;
            $btn.text(`重新发送(${count}s)`);
            if (count <= 0) {
                clearInterval(timer);
                isCounting = false;
                $btn.prop("disabled", false).text("发送验证码");
            }
        }, 1000);
    }
});