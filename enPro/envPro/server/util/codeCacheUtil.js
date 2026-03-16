// envPro/server/util/codeCacheUtil.js
// 存储结构：{ "邮箱": { "code": "验证码", "expireTime": 过期时间戳 } }
const codeCache = {};
const EXPIRE_TIME = 5 * 60 * 1000; // 5分钟，单位：毫秒

// 保存验证码
function saveCode(email, code) {
  codeCache[email] = {
    code,
    expireTime: Date.now() + EXPIRE_TIME
  };
}

// 获取验证码（校验是否过期）
function getCode(email) {
  const cache = codeCache[email];
  if (!cache) return null;
  // 过期则删除并返回null
  if (Date.now() > cache.expireTime) {
    delete codeCache[email];
    return null;
  }
  return cache.code;
}

// 验证验证码
function verifyCode(email, code) {
  const cacheCode = getCode(email);
  return cacheCode === code;
}

// 删除验证码（验证成功后）
function deleteCode(email) {
  delete codeCache[email];
}

// 注册相关的别名函数（保持与user.js兼容）
function saveRegisterCode(email, code) {
  return saveCode(email, code);
}

function verifyRegisterCode(email, code) {
  const isValid = verifyCode(email, code);
  // 验证成功后删除验证码
  if (isValid) {
    deleteCode(email);
  }
  return isValid;
}

module.exports = { saveCode, getCode, deleteCode, verifyCode, saveRegisterCode, verifyRegisterCode };