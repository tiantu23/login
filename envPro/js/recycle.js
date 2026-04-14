"use strict";

const materialsData = [
  [
    { img: "images/recycle/paper.png", name: "废纸", category: "可回收物-纸类", intro: "废纸是指使用过的纸张，包括报纸、办公用纸、纸箱等，不包括受污染的纸巾和卫生纸。废纸回收后可重新制浆生产新纸，节约木材资源。", method: "1. 去除纸张中的非纸类杂质；2. 分类打包避免污染；3. 送至造纸厂进行脱墨、制浆；4. 生产再生纸产品。" },
    { img: "images/recycle/plastic.jpg", name: "塑料瓶", category: "可回收物-塑料类", intro: "PET塑料瓶是最常见的饮料包装，具有质轻、耐用、透明的特点，回收后可加工成纤维、塑料制品等。", method: "1. 清空瓶内液体并压扁；2. 去除瓶盖和标签；3. 分类投放至塑料回收箱；4. 回收后破碎、清洗、造粒再利用。" },
    { img: "images/recycle/glass.jpg", name: "玻璃瓶", category: "可回收物-玻璃类", intro: "玻璃瓶具有高透明度、耐腐蚀的特点，主要用于食品、饮料包装，玻璃可无限次回收利用且质量不下降。", method: "1. 清空瓶内残留物并清洗；2. 按颜色分类（白、棕、绿）；3. 避免破碎后划伤；4. 回收后破碎、熔融重制成新玻璃制品。" }
  ],
  [
    { img: "images/recycle/metal.jpg", name: "易拉罐", category: "可回收物-金属类", intro: "铝制易拉罐重量轻、易回收，回收1吨铝可节约4吨铝土矿，减少95%的能源消耗。", method: "1. 压扁减少体积；2. 去除罐内残留物；3. 分类投放；4. 回炉熔炼制成新铝制品。" },
    { img: "images/recycle/cloth.jpg", name: "旧衣物", category: "可回收物-纺织类", intro: "废旧衣物包括棉质、化纤、羊毛等各类服装，成色较好的可捐赠，破损的可回收加工成再生纤维。", method: "1. 分类整理，区分材质；2. 清洗消毒；3. 成色好的捐赠，破损的破碎加工；4. 制成再生棉、隔音材料等。" },
    { img: "images/recycle/battery.jpg", name: "锂电池", category: "有害垃圾-电池类", intro: "锂电池广泛应用于手机、电动车等设备，含有钴、锂等重金属，随意丢弃会污染土壤和水源。", method: "1. 单独存放避免短路；2. 送至专门的电池回收点；3. 专业拆解提取有价金属；4. 无害化处理废旧电解液。" }
  ],
  [
    { img: "images/recycle/electronic.jpg", name: "电器电子产品", category: "可回收物 - 电子类", intro: "由钢/铝合金、塑料、玻璃复合制成，含金、铜等贵金属，回收1吨废旧电脑可提炼0.2克黄金、200克铜，节约超50%矿产资源。", method: "1. 断电静置，拆分锂电池；2. 清洁外壳，归类附件；3. 投社区电子回收点；4. 专业拆解再生金属、塑料。" },
    { img: "images/recycle/furniture.png", name: "大件家具（木质/金属框架）", category: "可回收物 - 家具类", intro: "含实木/人造板、钢/铝合金框架，金属回收率 95%，实木可二次加工，减少木材消耗。", method: "1. 拆解面料、玻璃部件；2. 分类归集木质、金属件；3. 预约社区大件清运；4. 金属回炉、实木再生板材。" },
    { img: "images/recycle/milk.jpg", name: "纸基复合包装", category: "可回收物 - 纸塑类", intro: "由纸、塑料、铝箔复合而成（如牛奶盒），回收后可分离材料，1 吨复合包装能再生约 0.5 吨纸、0.2吨塑料。", method: "1. 冲洗残留液；2. 压扁减少体积；3. 单独投放至复合包装回收口；4. 专业分离再生纸 / 塑料。" }
  ],
  [
    { img: "images/recycle/rubber.jpg", name: "废旧橡胶制品", category: "可回收物 - 橡胶类", intro: "以天然 / 合成橡胶为主（如废旧轮胎），回收 1 吨橡胶可生产 0.8 吨再生橡胶，替代部分新橡胶。", method: "1. 清理表面杂质；2. 拆分金属钢丝（若有）；3. 投至专业橡胶回收点；4. 粉碎再生为橡胶制品原料。" },
    { img: "images/recycle/aluminum.jpg", name: "铝箔制品", category: "可回收物 - 金属类", intro: "纯铝压制成箔（如干净锡纸），回收 1 吨铝箔可节约 3 吨铝土矿，能耗仅为原铝的 5%。", method: "1. 去除油污 / 食物残渣；2. 揉成团减少空隙；3. 分类投放至金属回收桶；4. 熔炼再生为新铝制品。" },
    { img: "images/recycle/newspaper.png", name: "旧报纸", category: "可回收物 - 纸类", intro: "旧报纸是常见的可回收物品，新闻印刷纸，纤维细腻，适合再生高品质纸张，经过处理后可以再生为新的纸张。", method: "1. 清理报纸上的污渍；2. 按照规格分类打包；3. 投放至可回收物收集点；4. 送至造纸厂进行再生处理。" }
  ],
  [
     { img: "images/recycle/book.png", name: "书刊杂志", category: "可回收物 - 纸类", intro: "书刊杂志是常见的可回收物品，铜版纸、胶版纸印刷品，可回收再制成纸浆，经过处理后可以再生为新的纸张。", method: "1. 清理报纸上的污渍；2. 按照规格分类打包；3. 投放至可回收物收集点；4. 送至造纸厂进行再生处理。" },
    { img: "images/recycle/plastic-container.png", name: "塑料餐盒", category: "可回收物 - 塑料类", intro: "塑料餐盒是常见的可回收物品，经过处理后可以再生为新的纸张。", method: "1. 清洗干净残留油污，沥干后投放。" },
    { img: "images/recycle/plastic-toy.png", name: "塑料玩具", category: "可回收物 - 塑料类", intro: "日用硬质塑料容器，耐磨损易再生。", method: "1. 清洗干净，直接投入可回收物桶。" }
  ],
  [
    { img: "images/recycle/pglass.png", name: "平板玻璃", category: "可回收物 - 玻璃类", intro: "旧窗户玻璃、镜子玻璃、玻璃摆件。", method: "1. 保持完整，避免尖锐伤人，单独捆扎投放。" },
    { img: "images/recycle/iron.png", name: "废铁", category: "可回收物 - 金属类", intro: "废铁是常见的可回收物品，如铁丝、铁锅、铁架、铁皮等黑色金属，经过处理后可以再生为新的金属材料。", method: "1. 清洗干净残留油污，沥干后投放，可回收冶炼再生钢材。" },
    { img: "images/recycle/copper.png", name: "废铜", category: "可回收物 - 金属类", intro: "废铜是常见的可回收物品，如铜线、铜管、铜制品等，导电性好，再生价值高，经过处理后可以再生为新的铜材料。", method: "1. 剥离绝缘层，单独收集，交由专业回收。" }
  ],[
    { img: "images/recycle/curtain.png", name: "旧窗帘布", category: "可回收物 - 纺织类", intro: " 涤纶、棉麻等织物制成，可回收再加工为布料或填充物。", method: "1.  无严重破损霉变，折叠投放织物回收箱。" },
    { img: "images/recycle/clo.png", name: "旧棉被", category: "可回收物 - 纺织类", intro: "棉絮、被芯、枕头等家纺用品。", method: "1. 无霉变、无大量污渍，投放织物回收箱。" },
    { img: "images/recycle/bag-shoe.png", name: "旧书包/鞋", category: "可回收物 - 纺织/橡塑类", intro: "布料、橡胶、皮革制成的鞋包。", method: "1. 清洁后投放织物回收或可回收物桶。" }
  ],[
    { img: "images/recycle/foam.png", name: "快递泡沫", category: "可回收物 - 泡沫塑料类", intro: "聚苯乙烯泡沫缓冲材料，可热熔再生颗粒。", method: "1.  压缩体积，清洁干燥后投放。" },
    { img: "images/recycle/umbrella.png", name: "旧雨伞骨架", category: "可回收物 - 金属类", intro: "多为铁、铝材质伞骨，属于废旧金属，可冶炼再生。", method: "1. 去除伞面布料，单独收集金属骨架投放。" },
    { img: "images/recycle/cd.png", name: "光盘碟片", category: "可回收物 - 塑料金属复合类", intro: "由聚碳酸酯与金属镀层制成，可提取塑料与金属再生。", method: "1. 擦拭干净，投放至可回收物或电子废弃物回收点。" }
  ],
  []
];


let currentPage = 1;
const pageSize = 3;
let allMaterials = materialsData.flat();
let filteredMaterials = [...allMaterials];

// ====================== 搜索 ======================
// ====================== 搜索（精确版：只搜名称） ======================
function doSearch() {
  const keyword = $('#material-search').val().toLowerCase().trim();
  if (!keyword) {
    filteredMaterials = [...allMaterials];
    renderPage(1);
    $('#search-result-tip').hide();
    return;
  }

  // 精确匹配：只在【物品名称】中搜索
  filteredMaterials = allMaterials.filter(item => {
    const name = (item.name || "").toLowerCase();
    return name.includes(keyword);
  });

  // 提示结果数量
  const tip = `找到 ${filteredMaterials.length} 条相关内容`;
  $('#search-result-tip').text(tip).show();
  renderPage(1);
}

// ====================== 分页渲染 ======================
function renderPage(page) {
  currentPage = page;
  const total = Math.ceil(filteredMaterials.length / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const data = filteredMaterials.slice(start, end);

  let html = "";
  if (data.length === 0) {
    html = `<div class="text-center" style="padding:30px;">没有找到相关内容</div>`;
  } else {
    data.forEach(item => {
      if (!item.name) return;
      html += `
      <div class="material-card" style="background:#fff; border-radius:8px; padding:15px; margin-bottom:10px; border:1px solid #eee; display:flex;gap:15px;align-items:center;">
        <img src="${item.img}" alt="${item.name}" style="width:100px;height:100px;object-fit:cover;border-radius:6px;">
        <div style="flex:1;">
          <h4 style="margin:0 0 5px 0;color:#4CAF50;">${item.name}</h4>
          <span style="background:#e8f5e9; padding:3px 6px; border-radius:4px; font-size:12px;">${item.category}</span>
          <p style="margin:5px 0;font-size:13px;">${item.intro}</p>
          <p style="margin:0;font-size:13px;color:#666;"><strong>回收：</strong>${item.method}</p>
        </div>
      </div>`;
    });
  }

  $('#materials-list').html(html);
  $('#current-page').text(page);
  $('#total-pages').text(total);
  $('#page-input').val(page);
  $('#prev-page').prop('disabled', page === 1);
  $('#next-page').prop('disabled', page >= total);
}

// ====================== 页面加载完成 ======================
$(document).ready(function() {
  // 板块切换
  $('.recycle-tab-btn').click(function() {
    $('.recycle-tab-btn').removeClass('active');
    $('.recycle-tab-panel').removeClass('active');
    $(this).addClass('active');
    const target = $(this).data('target');
    $(`#${target}-panel`).addClass('active');
    if(target === 'recycle-utilize') renderPage(1);
  });

  // 搜索
  $('#search-btn').click(doSearch);
  $('#material-search').keyup(function(e) {
    if (e.key === 'Enter') doSearch();
  });

  // 分页
  $('#prev-page').click(() => { if (currentPage > 1) renderPage(currentPage - 1); });
  $('#next-page').click(() => {
    const total = Math.ceil(filteredMaterials.length / pageSize);
    if (currentPage < total) renderPage(currentPage + 1);
  });
  $('#go-page').click(() => {
    const total = Math.ceil(filteredMaterials.length / pageSize);
    const p = parseInt($('#page-input').val());
    if (p >= 1 && p <= total) renderPage(p);
  });

  // 初始化
  renderPage(1);
});
$(document).ready(function() {
    // 从localStorage获取当前登录用户（和社区逻辑完全一样）
    let currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        currentUser = {
            id: "f9ea5e02-f813-4e1b-ae17-e6a618980f6a",
            name: "环保先锋",
            avatar: "环"
        };
    }

    let idleList = [];       // 全部闲置
    let myIdleList = [];     // 我的闲置
    let activeTab = "public-idle";
    let selectedImages = [];

    // 切换标签
    $('.dynamic-tabs .tab-item').on('click', function() {
        $('.tab-item').removeClass('active');
        $(this).addClass('active');
        activeTab = $(this).data('tab');
        renderIdleList();
    });

    // 图片预览
    $('#itemImages').on('change', function(e) {
        const files = e.target.files;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            selectedImages.push(file);
            const reader = new FileReader();
            reader.onload = e => {
                $('#imagePreview').append(`
                    <div class="preview-item">
                        <img src="${e.target.result}">
                        <span class="remove-img" data-index="${selectedImages.length-1}">×</span>
                    </div>
                `);
            };
            reader.readAsDataURL(file);
        }
        $('#itemImages').val('');
    });

    // 删除预览图
    $('#imagePreview').on('click', '.remove-img', function() {
        const idx = $(this).data('index');
        selectedImages.splice(idx, 1);
        $(this).parent().remove();
    });

    // 发布闲置
    $('#publishIdleForm').on('submit', function(e) {
        e.preventDefault();
        const item = {
            id: Date.now(),
            userId: currentUser.id,
            userName: currentUser.name,
            name: $('#itemName').val(),
            category: $('#itemCategory option:selected').text(),
            desc: $('#itemDesc').val(),
            location: $('#location').val(),
            type: $('input[name="exchangeType"]:checked').val(),
            images: [...selectedImages],
            createTime: new Date().toLocaleString()
        };

        myIdleList.unshift(item);
        idleList.unshift(item);
        renderIdleList();

        $(this)[0].reset();
        $('#imagePreview').empty();
        selectedImages = [];
        alert("发布成功！");
    });

    // 删除闲置
    $(document).on('click', '.delete-btn', function() {
        const id = $(this).data('id');
        if (!confirm("确定删除？")) return;
        myIdleList = myIdleList.filter(i => i.id != id);
        idleList = idleList.filter(i => i.id != id);
        renderIdleList();
    });
// 联系发布者弹窗
$(document).on('click', '.contact-btn', function () {
    const name = $(this).data('name');
    const user = $(this).data('user');
    const loc  = $(this).data('loc');
    const desc = $(this).data('desc');
    alert(`
📦 物品：${name}
👤 发布者：${user}
📍 位置：${loc}
📝 说明：${desc}

请线下或站内诚信交易~
    `);
});
    // 渲染列表
function renderIdleList() {
    const $box = $('#idleList');
    $box.empty();
    let list = activeTab === "my-idle" ? myIdleList : idleList;
    if (list.length === 0) {
        $box.html(`
            <div class="text-center">
                <i class="fa fa-leaf" style="font-size:48px;color:#4CAF50"></i>
                <p>暂无闲置</p>
            </div>
        `);
        return;
    }

    list.forEach(item => {
        const isMy = item.userId === currentUser.id;
        const delBtn = isMy ? `<div class="delete-btn" data-id="${item.id}"><i class="fa fa-trash"></i></div>` : '';

        let imgHtml = '';
        if (item.images && item.images.length > 0) {
            const src = URL.createObjectURL(item.images[0]);
            imgHtml = `
                <div class="idle-img-wrapper">
                    <img src="${src}">
                </div>
            `;
        }

        let typeText = { free: "免费赠送", lowPrice: "低价自提", exchange: "互相交换" }[item.type];

        $box.append(`
            <div class="idle-item ${isMy ? 'my-idle' : ''}">
                ${delBtn}
                ${imgHtml}

                <div class="idle-title">${item.name}</div>
                <div class="idle-cate">分类：${item.category}</div>
                <div class="idle-type">方式：${typeText}</div>

                <button class="contact-btn"
                    data-name="${item.name}"
                    data-user="${item.userName}"
                    data-loc="${item.location}"
                    data-desc="${item.desc}">
                    联系发布者
                </button>

                <div class="idle-footer">
                    发布者：${item.userName} | ${item.createTime}
                </div>
            </div>
        `);
    });
}
    renderIdleList();
});
// 绑定所有发送事件（页面加载完成后执行）
$(document).ready(function() {
    // 1. 点击发送按钮
    $('#send-btn').click(function() {
        sendChatMessage();
    });

    // 2. 回车发送
    $('#chat-input').keypress(function(e) {
        if(e.which === 13) {
            sendChatMessage();
        }
    });

    // 3. 快速提问按钮
    $('.quick-question').click(function() {
        const question = $(this).text().trim();
        $('#chat-input').val(question);
        sendChatMessage();
    });
});

// AI 聊天发送函数（完整修复版）
function sendChatMessage() {
    const message = $('#chat-input').val().trim();
    if(!message) return;

    // 添加用户消息（绿色气泡）
    $('#chat-window').append(`
        <div style="margin-bottom: 10px; text-align: right;">
            <div style="display: inline-block; background: #28a745; color: white; padding: 8px 12px; border-radius: 15px; max-width: 80%;">
                ${message}
            </div>
        </div>
    `);

    // 清空输入框
    $('#chat-input').val('');
    $('#chat-window').scrollTop($('#chat-window')[0].scrollHeight);

    // AI 回复
    setTimeout(() => {
        let reply = "你好！我是豆包AI环保助手，很高兴为你解答环保问题~";

        // 智能匹配关键词
        const msg = message.toLowerCase();
        if(msg.includes('垃圾分类') || msg.includes('垃圾')) {
            reply = "垃圾分类主要分为：可回收物、厨余垃圾、有害垃圾、其他垃圾。可回收物包含纸、塑料、玻璃、金属、织物等；厨余垃圾是易腐有机垃圾；有害垃圾含电池、灯管、药品等；其他垃圾为难以回收的废弃物。";
        } 
        else if(msg.includes('节能') || msg.includes('省电') || msg.includes('节水')) {
            reply = "家庭节能技巧：1. 使用节能电器，随手关闭电源；2. 空调夏季26℃、冬季20℃；3. 换成LED灯更省电；4. 一水多用，节约用水；5. 拔掉闲置插头，减少待机耗电。";
        } 
        else if(msg.includes('低碳出行') || msg.includes('出行')) {
            reply = "低碳出行方式：1. 短途步行/骑自行车；2. 中长途坐公交/地铁；3. 自驾选新能源汽车或拼车；4. 减少不必要出行，优先线上办公。";
        } 
        else if(msg.includes('旧衣物') || msg.includes('衣物')) {
            reply = "旧衣物环保处理：1. 干净完好可捐赠；2. 破损可回收再生为布料、纤维；3. 投放到小区旧衣回收箱，不要随意丢弃。";
        } 
        else if(msg.includes('装修') || msg.includes('环保材料')) {
            reply = "环保装修材料推荐：1. 低甲醛板材；2. 水性环保漆；3. 天然实木、竹材；4. 无胶、低胶环保产品；5. 选择有环保认证的材料。";
        }

        // 添加AI回复（灰色气泡）
        $('#chat-window').append(`
            <div style="margin-bottom: 10px; text-align: left;">
                <div style="display: inline-block; background: #f1f1f1; padding: 8px 12px; border-radius: 15px; max-width: 80%;">
                    ${reply}
                </div>
            </div>
        `);

        $('#chat-window').scrollTop($('#chat-window')[0].scrollHeight);
    }, 800);
}
// ====================== AI 图片识别上传与预览 ======================
$(document).ready(function() {
    const $uploadArea = $('#upload-area');
    const $uploadInput = $('#upload-input');
    const $recognizeBtn = $('#recognize-btn');
    const $resultPanel = $('#recognition-result');
    
    // 1. 点击上传区域触发文件选择
    $uploadArea.on('click', function() {
        $uploadInput.click();
    });

    // 2. 监听文件选择变化
    $uploadInput.on('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        // 简单校验文件大小 (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('图片大小不能超过 5MB');
            return;
        }

        // 使用 FileReader 读取图片并显示预览
        const reader = new FileReader();
        reader.onload = function(event) {
            const imgUrl = event.target.result;
            
            // 清空原有内容，插入图片预览和提示文字
            $uploadArea.html(`
                <img src="${imgUrl}" style="max-width: 100%; max-height: 300px; border-radius: 8px; margin-bottom: 10px;">
                <p style="color: #28a745; font-weight: bold;">图片已上传，点击下方按钮开始识别</p>
                <small>点击此处可重新选择图片</small>
            `);
            
            // 显示“开始AI识别”按钮
            $recognizeBtn.show();
            
            // 隐藏之前的识别结果（如果有）
            $resultPanel.hide();
        };
        reader.readAsDataURL(file);
    });

    // 3. 拖拽上传支持 (可选优化)
    $uploadArea.on('dragover', function(e) {
        e.preventDefault();
        $(this).css('background-color', '#e8f4ea');
    });

    $uploadArea.on('dragleave', function(e) {
        e.preventDefault();
        $(this).css('background-color', '');
    });

    $uploadArea.on('drop', function(e) {
        e.preventDefault();
        $(this).css('background-color', '');
        const files = e.originalEvent.dataTransfer.files;
        if (files.length > 0) {
            $uploadInput[0].files = files; // 将拖拽的文件赋值给 input
            $uploadInput.trigger('change'); // 触发 change 事件
        }
    });

    // 4. 模拟 AI 识别点击事件 (如果后续需要对接真实 API，在此处修改)
    $recognizeBtn.on('click', function() {
        // 这里可以添加调用后端 API 的逻辑
        // 目前仅做 UI 交互演示
        $(this).text('识别中...').prop('disabled', true);
        
        setTimeout(() => {
            // 模拟返回结果
            $('#waste-type').text('可回收物 - 塑料瓶');
            $('#waste-desc').text('PET塑料材质，常见于饮料包装。');
            $('#recycle-scheme').text('1. 清空液体；2. 压扁瓶身；3. 投入可回收物桶。');
            
            $resultPanel.fadeIn();
            $(this).text('开始AI识别').prop('disabled', false);
        }, 1500);
    });
});