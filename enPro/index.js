// 项目主入口文件
// 直接在代码中设置环境变量以禁用SSL证书验证
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// 加载环境变量
require('dotenv').config({ path: '.env.local' });
const app = require('./envPro/server/config/app');

// 显式打印启动日志，方便Vercel日志排查
console.log('后端服务已加载并启动');