const express = require('express');
const app = express();
// 关键修改1：使用Vercel的环境端口，本地默认3000
const port = process.env.PORT || 3000; 

// 引入Supabase配置
const { supabase, testConnection } = require('./db');

// 解决跨域问题（前端调用后端接口必须配置）
const cors = require('cors');
app.use(cors());

// 解析JSON请求体
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 配置文件上传中间件
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 创建uploads目录（如果不存在）
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置multer存储
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'image-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// 创建上传实例
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB限制
    },
    fileFilter: (req, file, cb) => {
        // 只允许图片文件
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('只允许上传图片文件（jpeg, jpg, png, gif）'));
    }
});

// 使upload实例可用于路由
app.locals.upload = upload;

// 静态文件服务：提供uploads目录下的文件访问
app.use('/uploads', express.static(uploadDir));

// 引入路由
const userRouter = require('./routes/user');
const postRouter = require('./routes/post');

// 挂载路由
app.use('/api/user', userRouter);       // 前缀/api/user
app.use('/api/post', postRouter);       // 前缀/api/post

// 直接启动服务，不在启动时强制要求Supabase连接成功
// 连接问题将在实际请求处理中捕获和处理
// 新增：托管项目根目录下的静态文件（比如login.html、index.html）
app.use(express.static('.')); // 表示托管当前项目根目录下的所有文件

app.listen(port, () => {
  // 关键修改2：日志输出适配Vercel，去掉localhost
  console.log(`后端服务运行在端口：${port}`);
  console.log('✅ 服务已启动，Supabase连接将在实际请求时验证');
});

// 新增：健康检查接口（方便测试Vercel部署是否成功）
app.get('/', (req, res) => {
  res.send('✅ 后端服务已正常启动！可访问 /api/user 测试接口');
});