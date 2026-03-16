// ========== 配置中心（火山方舟大模型） ==========
const DOUBAO_CONFIG = {
  API_KEY: "ff4c00ef-cc9a-4a40-93ed-56c096b274b4", // 替换为你的火山方舟API Key
  API_URL: "https://ark.cn-beijing.volces.com/api/v3/chat/completions", // 补全火山方舟完整接口路径
  MODEL: "ep-20260108163133-mvpf8", // 你的火山方舟模型ID
  TEMPERATURE: 0.7,
  MAX_TOKENS: 500,
  
  // 系统提示词
  SYSTEM_PROMPT: "你是一个专业的环保助手，专注于解答环保相关问题，包括垃圾分类、低碳生活、环保政策、绿色出行等，回答要专业、易懂、实用，语言简洁，回复控制在200字以内。",
  
  // 超时配置
  TIMEOUT: 20000, // 10秒超时
  
  // 错误提示文案
  ERROR_MSG: {
    NETWORK: "网络异常，请检查网络连接后重试",
    AUTH: "API密钥无效，请核对你的API Key",
    TIMEOUT: "请求超时，请稍后再试",
    EMPTY: "请输入你的环保问题！",
    UNKNOWN: "抱歉，暂时无法回答你的问题，请稍后再试",
    CONFIG: "配置错误，请检查API Key和接口地址"
  },
  
  // 样式配置（抽离便于维护）
  STYLE: {
    userMsgBg: "#28a745",
    aiMsgBg: "#f1f1f1",
    msgRadius: "15px",
    msgPadding: "8px 12px",
    maxWidth: "80%"
  }
};

// ========== 工具函数 ==========
/**
 * 日志工具（浏览器环境兼容版）
 * @param {string} type 日志类型: log/error/warn
 * @param {string} msg 日志信息
 * @param {any} data 附加数据
 */
const logger = (type, msg, data = null) => {
  // 兼容未定义window.NODE_ENV的情况，默认显示日志
  const isProduction = typeof window !== 'undefined' && window.NODE_ENV === "production";
  if (isProduction) return; 
  
  const prefix = `[环保AI助手-${new Date().toLocaleTimeString()}]`;
  const logData = data ? data : "";
  
  switch(type) {
    case "error":
      console.error(`${prefix} 错误: ${msg}`, logData);
      break;
    case "warn":
      console.warn(`${prefix} 警告: ${msg}`, logData);
      break;
    case "info":
      console.log(`${prefix} 信息: ${msg}`, logData);
      break;
    default:
      console.log(`${prefix}: ${msg}`, logData);
  }
};

/**
 * 验证配置有效性
 * @returns {boolean} 配置是否有效
 */
const validateConfig = () => {
  const { API_KEY, API_URL, ERROR_MSG } = DOUBAO_CONFIG;
  
  // 更严格的配置校验
  const isKeyValid = !!API_KEY && API_KEY.trim() !== "" && API_KEY !== "";
  const isUrlValid = !!API_URL && API_URL.trim() !== "" && API_URL.startsWith("https");
  
  if (!isKeyValid) {
    logger("error", "API Key配置无效", { API_KEY });
    alert(ERROR_MSG.CONFIG);
    return false;
  }
  
  if (!isUrlValid) {
    logger("error", "API地址配置错误", { API_URL });
    alert(ERROR_MSG.CONFIG);
    return false;
  }
  
  return true;
};

// ========== 核心聊天类 ==========
class EnvChatAssistant {
  constructor() {
    // DOM元素缓存
    this.dom = {
      chatWindow: null,
      chatInput: null,
      sendBtn: null,
      quickQuestionBtns: []
    };
    
    // 绑定this指向（简化写法）
    this.bindEvents = this.bindEvents.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleQuickQuestion = this.handleQuickQuestion.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.callLLMAPI = this.callLLMAPI.bind(this);
    
    // 防止重复请求
    this.isRequesting = false;
  }

  /**
   * 初始化：获取DOM元素 + 绑定事件
   */
  init() {
    if (!validateConfig()) return;
    
    // 获取DOM元素并容错
    this.dom.chatWindow = document.getElementById('chat-window');
    this.dom.chatInput = document.getElementById('chat-input');
    this.dom.sendBtn = document.getElementById('send-btn');
    this.dom.quickQuestionBtns = Array.from(document.querySelectorAll('.quick-question') || []);
    
    // DOM元素校验
    const missingElements = [];
    if (!this.dom.chatWindow) missingElements.push('chat-window');
    if (!this.dom.chatInput) missingElements.push('chat-input');
    
    if (missingElements.length > 0) {
      const errorMsg = `页面缺少核心元素：${missingElements.join(', ')}`;
      logger("error", errorMsg);
      alert(errorMsg);
      return;
    }
    
    if (!this.dom.sendBtn) {
      logger("warn", "未找到send-btn元素，发送按钮功能不可用");
    }
    
    this.bindEvents();
    logger("info", "环保AI助手初始化完成");
    
    // 初始化欢迎语
    this.addMessage("你好！我是环保助手，有任何环保相关问题都可以问我～", false);
  }

  /**
   * 绑定所有事件监听
   */
  bindEvents() {
    // 发送按钮点击事件
    if (this.dom.sendBtn) {
      this.dom.sendBtn.addEventListener('click', () => {
        this.sendMessage(this.dom.chatInput.value);
      });
    }

    // 回车键发送消息（兼容移动端）
    this.dom.chatInput.addEventListener('keypress', this.handleKeyPress);
    
    // 快速提问按钮事件
    this.dom.quickQuestionBtns.forEach(btn => {
      btn.addEventListener('click', this.handleQuickQuestion);
      // 增加按钮禁用态（可选）
      btn.style.cursor = "pointer";
      btn.addEventListener('mousedown', () => btn.style.opacity = "0.8");
      btn.addEventListener('mouseup', () => btn.style.opacity = "1");
    });
    
    // 输入框聚焦
    this.dom.chatInput.focus();
  }

  /**
   * 回车键发送处理（兼容shift+enter换行）
   */
  handleKeyPress(e) {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // shift+enter 换行
        return;
      }
      e.preventDefault();
      this.sendMessage(this.dom.chatInput.value);
    }
  }

  /**
   * 快速提问按钮点击处理
   */
  handleQuickQuestion(e) {
    const btn = e.target.closest('.quick-question');
    if (!btn || this.isRequesting) return;
    
    const question = btn.textContent.replace(/[\n\r\s]+/g, ' ').trim();
    if (question) {
      this.sendMessage(question);
    }
  }

  /**
   * 添加聊天消息到界面
   * @param {string} content 消息内容
   * @param {boolean} isUser 是否是用户消息
   * @returns {HTMLElement} 消息元素
   */
  addMessage(content, isUser = false) {
    if (!content || content.trim() === '') return null;
    
    const cleanContent = content.trim();
    const { STYLE } = DOUBAO_CONFIG;
    
    // 创建消息容器
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isUser ? 'user-message' : 'ai-message'}`;
    messageDiv.style.cssText = `
      margin-bottom: 12px;
      text-align: ${isUser ? 'right' : 'left'};
      padding: 0 8px;
    `;
    
    // 创建内容容器
    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = `
      display: inline-block;
      padding: ${STYLE.msgPadding};
      border-radius: ${STYLE.msgRadius};
      max-width: ${STYLE.maxWidth};
      background-color: ${isUser ? STYLE.userMsgBg : STYLE.aiMsgBg};
      color: ${isUser ? '#fff' : '#000'};
      word-wrap: break-word;
      white-space: pre-wrap;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    `;
    contentDiv.textContent = cleanContent;
    
    messageDiv.appendChild(contentDiv);
    this.dom.chatWindow.appendChild(messageDiv);
    
    // 自动滚动到底部
    this.dom.chatWindow.scrollTo({
      top: this.dom.chatWindow.scrollHeight,
      behavior: 'smooth'
    });
    
    return messageDiv;
  }

  /**
   * 添加加载中消息
   * @returns {number} 加载消息索引
   */
  addLoadingMessage() {
    return this.addMessage('正在思考中...请稍候', false);
  }

  /**
   * 移除加载中消息
   * @param {number} index 消息索引
   */
  removeLoadingMessage(index) {
    if (!this.dom.chatWindow || this.dom.chatWindow.children.length === 0) return;
    
    const targetIndex = typeof index === 'number' ? index : this.dom.chatWindow.children.length - 1;
    const loadingMessage = this.dom.chatWindow.children[targetIndex];
    
    if (loadingMessage && loadingMessage.textContent.includes('正在思考中')) {
      this.dom.chatWindow.removeChild(loadingMessage);
    }
  }

  /**
   * 调用火山方舟大模型API
   * @param {string} question 用户问题
   * @returns {Promise<string>} 回答内容/错误信息
   */
  async callLLMAPI(question) {
    if (!validateConfig() || this.isRequesting) return DOUBAO_CONFIG.ERROR_MSG.UNKNOWN;
    
    // 标记请求中，防止重复提交
    this.isRequesting = true;
    const loadingIndex = this.addLoadingMessage();
    const { API_KEY, API_URL, MODEL, TEMPERATURE, MAX_TOKENS, SYSTEM_PROMPT, TIMEOUT, ERROR_MSG } = DOUBAO_CONFIG;

    try {
      // 构造火山方舟API请求参数（符合OpenAI兼容规范）
      const requestData = {
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: question.trim() }
        ],
        temperature: TEMPERATURE,
        max_tokens: MAX_TOKENS,
        stream: false // 关闭流式响应（适合简单场景）
      };
      
      logger("info", "调用火山方舟API", { requestData });
      
      // 兼容axios不存在的情况
      if (typeof axios === 'undefined') {
        throw new Error('axios未加载，请引入axios CDN');
      }
      
      const response = await axios({
        method: 'post',
        url: API_URL,
        data: requestData,
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        timeout: TIMEOUT,
        // 防止跨域问题（开发环境）
        withCredentials: false
      });
      
      // 校验响应数据
      if (!response.data) {
        logger("warn", "API返回空数据", { response });
        return ERROR_MSG.UNKNOWN;
      }
      
      if (!response.data.choices || response.data.choices.length === 0) {
        logger("warn", "API返回数据格式异常", { response: response.data });
        return ERROR_MSG.UNKNOWN;
      }
      
      const answer = response.data.choices[0].message?.content || ERROR_MSG.UNKNOWN;
      logger("info", "API调用成功", { answer });
      
      return answer;
      
    } catch (error) {
      let errorMsg = ERROR_MSG.UNKNOWN;
      logger("error", "API调用失败", { 
        code: error.code,
        status: error.response?.status,
        message: error.message,
        responseData: error.response?.data
      });
      
      // 更精细的错误分类
      if (error.code === 'ECONNABORTED') {
        errorMsg = ERROR_MSG.TIMEOUT;
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        errorMsg = ERROR_MSG.AUTH;
      } else if (!error.response) {
        // 区分网络错误和axios未定义
        errorMsg = error.message.includes('axios') ? '缺少axios依赖' : ERROR_MSG.NETWORK;
      } else if (error.response?.status >= 500) {
        errorMsg = '服务器内部错误，请稍后再试';
      }
      
      return errorMsg;
      
    } finally {
      // 移除加载态，重置请求标记
      this.removeLoadingMessage(loadingIndex);
      this.isRequesting = false;
    }
  }

  /**
   * 发送消息主逻辑
   * @param {string} question 用户输入的问题
   */
  async sendMessage(question) {
    // 空值校验
    if (!question || question.trim() === '') {
      alert(DOUBAO_CONFIG.ERROR_MSG.EMPTY);
      return;
    }
    
    // 防止重复请求
    if (this.isRequesting) {
      logger("warn", "已有请求中，禁止重复提交");
      return;
    }
    
    const cleanQuestion = question.trim();
    // 添加用户消息
    this.addMessage(cleanQuestion, true);
    // 清空输入框并聚焦
    this.dom.chatInput.value = '';
    this.dom.chatInput.focus();
    
    // 调用API并添加AI回复
    const answer = await this.callLLMAPI(cleanQuestion);
    this.addMessage(answer, false);
  }
}

// ========== 页面加载初始化 ==========
// 兼容DOMContentLoaded未触发的情况
const initChat = () => {
  try {
    const chatAssistant = new EnvChatAssistant();
    chatAssistant.init();
    window.EnvChatAssistant = chatAssistant;
    logger("info", "环保AI助手已挂载到window对象");
  } catch (error) {
    logger("error", "初始化失败", error);
    alert(`初始化出错：${error.message}`);
  }
};

// 优先使用DOMContentLoaded，兼容延迟加载
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initChat();
} else {
  document.addEventListener('DOMContentLoaded', initChat);
}

// 全局错误捕获
window.addEventListener('error', (e) => {
  logger("error", "全局脚本错误", {
    message: e.message,
    filename: e.filename,
    lineno: e.lineno
  });
});