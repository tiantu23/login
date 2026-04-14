// 环保小贴士广播通知（居中悬浮，无背景色，带小喇叭）
$(function() {
  var tips = [
    '随手关灯，节约用电。',
    '出门自带水杯，减少一次性塑料。',
    '多步行、骑行，绿色低碳出行。',
    '垃圾分类，保护环境人人有责。',
    '节约用水，从点滴做起。',
    '多用环保袋，拒绝白色污染。',
    '绿色办公，双面打印更环保。',
    '多植树，绿化美化家园。',
    '旧物回收再利用，减少浪费。',
    '支持绿色产品，守护美丽地球。'
  ];
  var idx = 0;
  function showTip(text) {
    var $bar = $('#env-tip-broadcast');
    if ($bar.length === 0) {
      $bar = $('<div id="env-tip-broadcast"><span class="tip-icon" style="margin-right:8px;"><i class="fa fa-bullhorn"></i></span><span class="tip-text"></span></div>');
      $bar.css({
        position: 'fixed',
        top: '90px',
        left: '50%',
        transform: 'translateX(-50%)',
        minWidth: '260px',
        maxWidth: '90vw',
        background: 'rgba(255,255,255,0.5)',
        color: 'transparent',
        fontSize: '18px',
        fontWeight: 'bold',
        textAlign: 'center',
        padding: '10px 28px',
        zIndex: 10000,
        letterSpacing: '1px',
        borderRadius: '28px',
        boxShadow: '0 4px 16px rgba(56, 249, 215, 0.10)',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 1,
        fontFamily: 'Montserrat, Raleway, sans-serif',
        transition: 'background 0.3s'
      });
      $bar.find('.tip-text').css({
        background: 'linear-gradient(90deg, #b0f4c6 0%, #aafbec 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        textFillColor: 'transparent',
        fontWeight: 700,
        letterSpacing: '1.5px',
        fontSize: '18px',
        fontFamily: 'Montserrat, Raleway, sans-serif',
        transition: 'background 0.3s'
      });
      $bar.find('.tip-icon').css({
        color: '#fff',
        fontSize: '22px',
        marginRight: '10px',
        filter: 'drop-shadow(0 1px 2px #b4f1e6)'
      });
      $('.preloader').after($bar); // 插入到 preloader 之后
    }
    $bar.find('.tip-text').text('环保小贴士：' + text);
    $bar.stop(true).css('opacity', 0).animate({opacity: 1}, 600).delay(3400).animate({opacity: 0.85}, 800);
  }
  showTip(tips[idx]);
  setInterval(function() {
    idx = (idx + 1) % tips.length;
    showTip(tips[idx]);
  }, 5000);
});
