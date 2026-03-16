// ai-recognition.js - 独立的AI图片识别模块
"use strict";

// ========== 火山方舟大模型配置 ==========
const DOUBAO_CONFIG = {
  API_KEY: "ff4c00ef-cc9a-4a40-93ed-56c096b274b4", // 替换为你的真实API Key
  API_URL: "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
  MODEL: "ep-20260108163133-mvpf8", // 替换为你的真实模型ID
  TEMPERATURE: 0.7,
  MAX_TOKENS: 500,
  TIMEOUT: 20000, // 20秒超时
  
  // 垃圾分类专用系统提示词
  SYSTEM_PROMPT: `你是专业的垃圾分类识别专家，需要根据用户提供的图片描述（或图片内容），完成以下任务：
1. 准确识别垃圾类型（格式：XX垃圾（XX类），例如：塑料饮料瓶（可回收物））；
2. 给出该垃圾的详细说明（100字以内）；
3. 给出具体的回收/处理方案（分步骤，150字以内）；
输出格式必须严格按照JSON返回，包含三个字段：wasteType、wasteDesc、recycleScheme，不允许返回其他内容。`
};

// ========== 核心AI识别函数 ==========
/**
 * 图片转Base64（用于上传识别）
 * @param {File} file - 上传的图片文件
 * @returns {Promise<string>} Base64编码的图片字符串
 */
function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("未选择图片文件"));
      return;
    }

    // 校验文件类型和大小
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      reject(new Error("仅支持JPG、PNG、WEBP格式图片"));
      return;
    }

    if (file.size > maxSize) {
      reject(new Error("图片大小不能超过5MB"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error("图片读取失败"));
    reader.readAsDataURL(file);
  });
}

/**
 * 调用火山方舟AI识别垃圾分类
 * @param {File} imageFile - 图片文件
 * @returns {Promise<Object>} 识别结果（wasteType/wasteDesc/recycleScheme）
 */
async function recognizeGarbageByAI(imageFile) {
  try {
    // 1. 图片转Base64
    const base64Image = await imageToBase64(imageFile);
    
    // 2. 构建请求参数（支持图片+文本提示）
    const requestData = {
      model: DOUBAO_CONFIG.MODEL,
      temperature: DOUBAO_CONFIG.TEMPERATURE,
      max_tokens: DOUBAO_CONFIG.MAX_TOKENS,
      messages: [
        {
          role: "system",
          content: DOUBAO_CONFIG.SYSTEM_PROMPT
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: base64Image // 传入Base64图片
              }
            },
            {
              type: "text",
              text: "请识别这张图片中的垃圾类型，并按照要求返回JSON格式的结果"
            }
          ]
        }
      ]
    };

    // 3. 发送请求（带超时控制）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DOUBAO_CONFIG.TIMEOUT);

    const response = await fetch(DOUBAO_CONFIG.API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DOUBAO_CONFIG.API_KEY}`
      },
      body: JSON.stringify(requestData),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // 4. 处理响应
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`AI接口调用失败：${errorData.error?.message || `HTTP ${response.status}`}`);
    }

    const result = await response.json();
    const aiContent = result.choices[0]?.message?.content?.trim() || "";

    // 5. 解析JSON结果
    let parseResult;
    try {
      parseResult = JSON.parse(aiContent);
    } catch (e) {
      throw new Error(`AI返回格式错误：${aiContent}，请检查提示词是否正确`);
    }

    // 6. 校验返回字段
    if (!parseResult.wasteType || !parseResult.wasteDesc || !parseResult.recycleScheme) {
      throw new Error("AI返回结果字段不完整");
    }

    return parseResult;

  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("请求超时，请稍后重试");
    }
    throw error;
  }
}

/**
 * 初始化AI图片识别交互
 * （绑定DOM事件，处理页面交互）
 */
function initAIRecognition() {
  // 1. 点击上传区域触发文件选择
  const $uploadArea = document.getElementById("upload-area");
  const $uploadInput = document.getElementById("upload-input");
  const $recognizeBtn = document.getElementById("recognize-btn");
  const $resultArea = document.getElementById("recognition-result");

  if (!$uploadArea || !$uploadInput || !$recognizeBtn || !$resultArea) {
    console.warn("AI识别相关DOM元素未找到");
    return;
  }

  // 点击上传区域
  $uploadArea.addEventListener("click", () => {
    $uploadInput.click();
  });

  // 拖拽上传（增强体验）
  $uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    $uploadArea.style.border = "2px solid #28a745";
  });

  $uploadArea.addEventListener("dragleave", () => {
    $uploadArea.style.border = "1px dashed #ccc";
  });

  $uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    $uploadArea.style.border = "1px dashed #ccc";
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      $uploadInput.files = files;
      handleFileSelect(files[0]);
    }
  });

  // 选择文件后处理
  $uploadInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  });

  // 点击识别按钮
  $recognizeBtn.addEventListener("click", async () => {
    const file = $uploadInput.files[0];
    if (!file) {
      alert("请先选择要识别的图片");
      return;
    }

    // 加载状态
    $recognizeBtn.textContent = "识别中...";
    $recognizeBtn.disabled = true;
    $resultArea.style.display = "none"; // 隐藏旧结果

    try {
      // 调用AI识别
      const result = await recognizeGarbageByAI(file);
      
      // 渲染结果
      document.getElementById("waste-type").textContent = result.wasteType;
      document.getElementById("waste-desc").textContent = result.wasteDesc;
      document.getElementById("recycle-scheme").textContent = result.recycleScheme;
      
      // 显示结果
      $resultArea.style.display = "block";

    } catch (error) {
      alert(`识别失败：${error.message}`);
      console.error("AI识别错误：", error);
    } finally {
      // 恢复按钮状态
      $recognizeBtn.textContent = "开始AI识别";
      $recognizeBtn.disabled = false;
    }
  });

  /**
   * 处理文件选择后的UI更新
   * @param {File} file - 选中的图片文件
   */
  function handleFileSelect(file) {
    // 显示识别按钮
    $recognizeBtn.style.display = "block";
    // 提示用户
    alert(`已选择图片：${file.name}（${(file.size / 1024 / 1024).toFixed(2)}MB），点击"开始AI识别"按钮进行分析`);
  }
}

// 页面加载完成后初始化
document.addEventListener("DOMContentLoaded", initAIRecognition);