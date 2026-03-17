$(document).ready(function() {
  // 定义分页配置
  const pageConfig = {
    environmental: { current: 1, total: 3, prefix: 'env' },
    lowcarbon: { current: 1, total: 3, prefix: 'low' },
    animal: { current: 1, total: 3, prefix: 'ani' },
    policy: { current: 1, total: 3, prefix: 'pol' },
    technology: { current: 1, total: 3, prefix: 'tec' },
    global: { current: 1, total: 3, prefix: 'glo' }
  };

  // 新闻分类切换
  $('.category-btn').click(function() {
    // 移除所有激活状态
    $('.category-btn').removeClass('active');
    $('.hot-news').removeClass('active');
    $('.news-list').removeClass('active');
    $('.news-pagination').removeClass('active');
    
    // 添加当前分类激活状态
    $(this).addClass('active');
    const category = $(this).data('category');
    
    // 显示对应分类的热门新闻、列表和分页
    $(`#hot-${category}`).addClass('active');
    $(`#list-${category}`).addClass('active');
    $(`#pagination-${category}`).addClass('active');
    
    // 重置当前分类的分页到第一页
    resetPage(category);
  });

  // 重置分页到第一页
  function resetPage(category) {
    const config = pageConfig[category];
    config.current = 1;
    
    // 更新分页按钮状态
    $(`#${config.prefix}-prev`).prop('disabled', true);
    $(`#${config.prefix}-next`).prop('disabled', false);
    $(`#${config.prefix}-current`).text(1);
    
    // 显示第一页内容，隐藏其他页
    $(`#${config.prefix}-page-1`).addClass('active').siblings().removeClass('active');
  }

  // 分页切换通用函数
  function changePage(category, direction) {
    const config = pageConfig[category];
    let newPage = config.current + direction;
    
    // 边界检查
    if (newPage < 1 || newPage > config.total) return;
    
    // 隐藏当前页
    $(`#${config.prefix}-page-${config.current}`).removeClass('active');
    // 显示新页
    $(`#${config.prefix}-page-${newPage}`).addClass('active');
    
    // 更新当前页码
    config.current = newPage;
    
    // 更新分页按钮状态
    $(`#${config.prefix}-prev`).prop('disabled', newPage === 1);
    $(`#${config.prefix}-next`).prop('disabled', newPage === config.total);
    
    // 更新页码显示
    $(`#${config.prefix}-current`).text(newPage);
  }

  // 绑定分页按钮事件
  // 环保类
  $('#env-next').click(() => changePage('environmental', 1));
  $('#env-prev').click(() => changePage('environmental', -1));
  
  // 低碳类
  $('#low-next').click(() => changePage('lowcarbon', 1));
  $('#low-prev').click(() => changePage('lowcarbon', -1));
  
  // 动物保护类
  $('#ani-next').click(() => changePage('animal', 1));
  $('#ani-prev').click(() => changePage('animal', -1));
  
  // 政策法规类
  $('#pol-next').click(() => changePage('policy', 1));
  $('#pol-prev').click(() => changePage('policy', -1));
  
  // 技术创新类
  $('#tec-next').click(() => changePage('technology', 1));
  $('#tec-prev').click(() => changePage('technology', -1));
  
  // 国际动态类
  $('#glo-next').click(() => changePage('global', 1));
  $('#glo-prev').click(() => changePage('global', -1));

  // 优化新闻列表点击体验
  $('.news-item').click(function(e) {
    // 如果点击的不是链接本身且不是"敬请期待"，触发链接跳转
    if (!$(e.target).is('a') && !$(this).find('.news-item-more').length) {
      const link = $(this).find('.news-item-title').attr('href');
      if (link) {
        window.location.href = link;
      }
    }
  });

  // 热门新闻图片懒加载（可选优化）
  $('.hot-news-img img').each(function() {
    const img = $(this);
    const src = img.attr('src');
    img.attr('data-src', src);
    img.attr('src', 'images/loading.gif'); // 加载占位图
    
    // 实际加载图片
    const newImg = new Image();
    newImg.onload = function() {
      img.attr('src', src);
    };
    newImg.src = src;
  });
});