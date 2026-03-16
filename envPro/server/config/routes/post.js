// post.js 社区动态路由
const express = require('express');
const router = express.Router(); // 必须定义router
const { supabase } = require('../db'); // 确认db.js路径正确

// 处理文件上传
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 创建uploads目录（如果不存在）
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
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

// 创建动态接口（支持图片上传）
router.post('/', upload.array('images'), async (req, res) => {
    try {
        const { user_id, content, permission } = req.body;
        
        if (!user_id || !content || !permission) {
            return res.status(400).json({ success: false, message: '用户ID、动态内容和权限是必填项' });
        }

        // 处理图片上传
        let imageUrl = null;
        if (req.files && req.files.length > 0) {
            // 暂时只使用第一张图片
            const file = req.files[0];
            imageUrl = `/uploads/${file.filename}`;
        }

        const { data: newPost, error: insertError } = await supabase
            .from('post')
            .insert([{
                user_id,
                content,
                image_url: imageUrl,
                permission,
                created_at: new Date(),
                updated_at: new Date()
            }])
            .select('id, user_id, content, image_url, permission, created_at, updated_at');
        
        if (insertError) throw insertError;
        if (!newPost || newPost.length === 0) {
            return res.status(500).json({ success: false, message: '动态创建失败' });
        }

        res.json({
            success: true,
            message: '动态创建成功',
            post: newPost[0]
        });
    } catch (err) {
        console.error('创建动态失败:', err);
        res.status(500).json({ success: false, message: '创建动态失败', error: err.message });
    }
});

// 获取公开动态列表接口
router.get('/public', async (req, res) => {
    try {
        const { data: posts, error } = await supabase
            .from('post')
            .select('id, user_id, content, image_url, permission, created_at, updated_at')
            .eq('permission', 'public')
            .order('created_at', { ascending: false });
        
        if (error) throw error;

        res.json({
            success: true,
            posts: posts || []
        });
    } catch (err) {
        console.error('获取公开动态失败:', err);
        res.status(500).json({ success: false, message: '获取公开动态失败', error: err.message });
    }
});

// 获取用户的所有动态接口
router.get('/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        const { data: posts, error } = await supabase
            .from('post')
            .select('id, user_id, content, image_url, permission, created_at, updated_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;

        res.json({
            success: true,
            posts: posts || []
        });
    } catch (err) {
        console.error('获取用户动态失败:', err);
        res.status(500).json({ success: false, message: '获取用户动态失败', error: err.message });
    }
});

// 更新动态接口
router.put('/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        const { user_id, content, image_url, permission } = req.body;
        
        if (!user_id) {
            return res.status(400).json({ success: false, message: '用户ID是必填项' });
        }

        // 检查动态是否存在且属于当前用户
        const { data: existingPost, error: checkError } = await supabase
            .from('post')
            .select('id, user_id')
            .eq('id', postId)
            .limit(1);
        
        if (checkError) throw checkError;
        if (!existingPost || existingPost.length === 0) {
            return res.status(404).json({ success: false, message: '动态不存在' });
        }
        if (existingPost[0].user_id !== user_id) {
            return res.status(403).json({ success: false, message: '无权修改此动态' });
        }

        // 更新动态
        const updateData = {
            updated_at: new Date()
        };
        if (content) updateData.content = content;
        if (image_url !== undefined) updateData.image_url = image_url;
        if (permission) updateData.permission = permission;

        const { data: updatedPost, error: updateError } = await supabase
            .from('post')
            .update(updateData)
            .eq('id', postId)
            .select('id, user_id, content, image_url, permission, created_at, updated_at');
        
        if (updateError) throw updateError;
        if (!updatedPost || updatedPost.length === 0) {
            return res.status(500).json({ success: false, message: '动态更新失败' });
        }

        res.json({
            success: true,
            message: '动态更新成功',
            post: updatedPost[0]
        });
    } catch (err) {
        console.error('更新动态失败:', err);
        res.status(500).json({ success: false, message: '更新动态失败', error: err.message });
    }
});

// 删除动态接口
router.delete('/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        const { user_id } = req.body;
        
        if (!user_id) {
            return res.status(400).json({ success: false, message: '用户ID是必填项' });
        }

        // 检查动态是否存在且属于当前用户
        const { data: existingPost, error: checkError } = await supabase
            .from('post')
            .select('id, user_id')
            .eq('id', postId)
            .limit(1);
        
        if (checkError) throw checkError;
        if (!existingPost || existingPost.length === 0) {
            return res.status(404).json({ success: false, message: '动态不存在' });
        }
        if (existingPost[0].user_id !== user_id) {
            return res.status(403).json({ success: false, message: '无权删除此动态' });
        }

        // 删除动态
        const { error: deleteError } = await supabase
            .from('post')
            .delete()
            .eq('id', postId);
        
        if (deleteError) throw deleteError;

        res.json({
            success: true,
            message: '动态删除成功'
        });
    } catch (err) {
        console.error('删除动态失败:', err);
        res.status(500).json({ success: false, message: '删除动态失败', error: err.message });
    }
});

// 必须导出router，否则app.js无法使用
module.exports = router;