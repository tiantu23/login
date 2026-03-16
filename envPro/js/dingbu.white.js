$(window).scroll(function() {
        if ($(this).scrollTop() > 50) {
            $('.clean-main-menu').addClass('scrolled');
        } else {
            $('.clean-main-menu').removeClass('scrolled');
        }
    });