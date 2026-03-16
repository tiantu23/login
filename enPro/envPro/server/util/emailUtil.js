// envPro/server/util/emailUtil.js
const nodemailer = require('nodemailer');

// 配置QQ邮箱SMTP（替换成你的邮箱和授权码）
const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: '3453914804@qq.com', // 你的QQ邮箱
    pass: 'lahyrfvuywdlcjbd'   // QQ邮箱SMTP授权码（不是登录密码）
  }
});

// 生成6位随机验证码
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 发送验证码邮件（通用函数）
async function sendVerifyCode(email, type = 'password') {
  const code = generateCode();
  try {
    // 根据类型设置不同的邮件主题和内容
    let subject, text, html;
    if (type === 'register') {
      subject = '注册验证码';
      text = `你的注册验证码是：${code}，5分钟内有效，请及时验证！`;
      html = `<p>你的注册验证码是：<strong>${code}</strong></p><p>5分钟内有效，请及时验证！</p>`;
    } else {
      subject = '密码找回验证码';
      text = `你的密码找回验证码是：${code}，5分钟内有效，请及时验证！`;
      html = `<p>你的密码找回验证码是：<strong>${code}</strong></p><p>5分钟内有效，请及时验证！</p>`;
    }

    // 发送邮件
    await transporter.sendMail({
      from: '"环保社区" <3453914804@qq.com>', // 发件人名称+邮箱
      to: email, // 收件人邮箱
      subject: subject, // 邮件标题
      text: text, // 纯文本内容
      html: html // HTML内容
    });
    return { success: true, code }; // 返回验证码（用于缓存）
  } catch (error) {
    console.error('发送邮件失败:', error);
    return { success: false, message: error.message };
  }
}

// 注册验证码发送函数（别名）
async function sendRegisterCode(email) {
  return sendVerifyCode(email, 'register');
}

module.exports = { sendVerifyCode, sendRegisterCode };