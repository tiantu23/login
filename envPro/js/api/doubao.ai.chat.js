$(document).ready(function () {
  // 绑定发送
  $('#send-btn').on('click', sendChat);
  $('#chat-input').on('keydown', function (e) {
    if (e.key === 'Enter') sendChat();
  });

  // 快速提问
  $('.quick-question').on('click', function () {
    const q = $(this).text().trim();
    $('#chat-input').val(q);
    sendChat();
  });
});

// 你提供的配置
const CONFIG = {
  API_KEY: "ff4c00ef-cc9a-4a40-93ed-56c096b274b4",
  API_URL: "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
  MODEL: "ep-20260108163133-mvpf8",
  SYSTEM_PROMPT: "你是专业环保AI助手，回答简洁、专业、实用，不超过200字。"
};

// 发送函数
async function sendChat() {
  const msg = $('#chat-input').val().trim();
  if (!msg) return;

  // 用户消息
  $('#chat-window').append(`
  <div style="margin-bottom:10px; text-align:right;">
    <div style="display:inline-block; background:#28a745; color:white; padding:8px 12px; border-radius:15px; max-width:80%;">
      ${msg}
    </div>
  </div>
  `);
  $('#chat-input').val('');
  scrollBottom();

  // 加载中
  $('#chat-window').append(`
  <div class="loading" style="margin-bottom:10px; text-align:left;">
    <div style="display:inline-block; background:#f1f1f1; padding:8px 12px; border-radius:15px; max-width:80%;">
      AI 思考中...
    </div>
  </div>
  `);

  try {
    const res = await fetch(CONFIG.API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CONFIG.API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: CONFIG.MODEL,
        messages: [
          { role: "system", content: CONFIG.SYSTEM_PROMPT },
          { role: "user", content: msg }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    $('.loading').remove();

    if (!res.ok) throw new Error(`API 错误 ${res.status}`);
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "抱歉，暂无回答";

    $('#chat-window').append(`
    <div style="margin-bottom:10px; text-align:left;">
      <div style="display:inline-block; background:#f1f1f1; padding:8px 12px; border-radius:15px; max-width:80%;">
        ${reply}
      </div>
    </div>
    `);

  } catch (err) {
    $('.loading').remove();
    $('#chat-window').append(`
    <div style="margin-bottom:10px; text-align:left;">
      <div style="display:inline-block; background:#f1f1f1; padding:8px 12px; border-radius:15px; max-width:80%;">
        请求失败：接口跨域或密钥/模型无效（前端无法绕过浏览器跨域）
      </div>
    </div>
    `);
    console.error(err);
  }

  scrollBottom();
}

// 滚动到底
function scrollBottom() {
  const c = $('#chat-window')[0];
  c.scrollTop = c.scrollHeight;
}