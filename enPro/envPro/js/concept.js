 $(document).ready(function() {
            $('#myCarousel').carousel({
                interval: 5000, // 自动轮播间隔时间（毫秒）
                pause: "hover"   // 鼠标悬停时暂停轮播
            });

            // 内容切换按钮点击事件
            $('.tab-btn').click(function() {
                // 移除所有按钮的active类
                $('.tab-btn').removeClass('active');
                // 给当前点击的按钮添加active类
                $(this).addClass('active');
                
                // 获取目标内容ID
                var targetId = $(this).attr('data-target');
                
                // 隐藏所有内容区域
                $('.content-section').removeClass('active');
                // 显示目标内容区域
                $('#' + targetId).addClass('active');
            });
        });