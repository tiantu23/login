$(window).scroll(function() {
        if ($(this).scrollTop() > 50) {
            $('.clean-main-menu').addClass('scrolled');
        } else {
            $('.clean-main-menu').removeClass('scrolled');
        }
    });
$(function(){
  var url = window.location.href;
  
  // 给每个导航链接匹配当前页面
  $(".clean-menu-wrapper li a").each(function(){
    var href = $(this).attr("href");
    
    if(url.indexOf(href) > -1){
      // 先清空所有高亮
      $(".clean-menu-wrapper li").removeClass("active");
      // 给当前页添加高亮
      $(this).parent().addClass("active");
    }
  });
});
