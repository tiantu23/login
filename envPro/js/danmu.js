// 简易弹幕广播实现
$(function() {
  // 弹幕内容队列，可根据需要动态获取
  var danmuList = [
    '欢迎来到绿色环保平台！',
    '践行环保理念，共建绿色家园！',
    '低碳生活，从我做起！',
    '垃圾分类，人人有责！',
    '绿色出行，健康生活！'
  ];
  var danmuIndex = 0;

  function launchDanmu(text) {
    var $danmu = $('<div class="danmu-item"></div>').text(text);
    $danmu.css({
      position: 'fixed',
      top: 60 + Math.random() * 100 + 'px',
      left: '100%',
      whiteSpace: 'nowrap',
      fontSize: '20px',
      color: '#28a745',
      fontWeight: 'bold',
      zIndex: 9999,
      pointerEvents: 'none',
      textShadow: '1px 1px 2px #fff',
      opacity: 0.92
    });
    $('body').append($danmu);
    $danmu.animate({ left: '-400px' }, 9000, 'linear', function() {
      $danmu.remove();
    });
  }

  // 定时循环弹幕
  setInterval(function() {
    launchDanmu(danmuList[danmuIndex]);
    danmuIndex = (danmuIndex + 1) % danmuList.length;
  }, 3500);

  // 可选：点击页面可发自定义弹幕
  // $(document).click(function() {
  //   var msg = prompt('输入你的弹幕内容：');
  //   if (msg) launchDanmu(msg);
  // });
});
