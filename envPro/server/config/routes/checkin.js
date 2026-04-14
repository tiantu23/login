const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// 创建打卡记录
router.post('/', async (req, res) => {
    try {
        const { user_id, checkin_date, preset_behaviors, custom_behavior, points_earned } = req.body;

        // 验证必填字段
        if (!user_id || !checkin_date || !points_earned) {
            return res.status(400).json({ success: false, message: '缺少必填字段' });
        }

        // 检查是否已经打卡
        const checkExisting = await pool.query(
            'SELECT id FROM checkin_records WHERE user_id = $1 AND checkin_date = $2',
            [user_id, checkin_date]
        );

        if (checkExisting.rows.length > 0) {
            return res.status(400).json({ success: false, message: '该日期已经打卡过了' });
        }

        // 插入打卡记录
        const result = await pool.query(
            `INSERT INTO checkin_records (user_id, checkin_date, preset_behaviors, custom_behavior, points_earned)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [user_id, checkin_date, preset_behaviors, custom_behavior, points_earned]
        );

        res.json({ success: true, message: '打卡成功', data: result.rows[0] });
    } catch (error) {
        console.error('创建打卡记录失败:', error);
        res.status(500).json({ success: false, message: '服务器内部错误' });
    }
});

// 获取用户打卡记录
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await pool.query(
            `SELECT * FROM checkin_records 
             WHERE user_id = $1 
             ORDER BY checkin_date DESC`,
            [userId]
        );

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('获取用户打卡记录失败:', error);
        res.status(500).json({ success: false, message: '服务器内部错误' });
    }
});

// 获取用户打卡统计
router.get('/stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // 获取当月打卡次数
        const monthlyResult = await pool.query(
            `SELECT COUNT(*) as monthly_count 
             FROM checkin_records 
             WHERE user_id = $1 
             AND EXTRACT(YEAR FROM checkin_date) = EXTRACT(YEAR FROM CURRENT_DATE)
             AND EXTRACT(MONTH FROM checkin_date) = EXTRACT(MONTH FROM CURRENT_DATE)`,
            [userId]
        );

        // 获取用户所有打卡记录，按日期降序排列
        const recordsResult = await pool.query(
            `SELECT checkin_date 
             FROM checkin_records 
             WHERE user_id = $1 
             ORDER BY checkin_date DESC`,
            [userId]
        );

        // 计算连续打卡天数
        let consecutive_days = 0;
        const records = recordsResult.rows;
        
        if (records.length > 0) {
            consecutive_days = 1; // 至少有一天打卡
            let prevDate = new Date(records[0].checkin_date);
            
            for (let i = 1; i < records.length; i++) {
                const currentDate = new Date(records[i].checkin_date);
                const diffTime = prevDate.getTime() - currentDate.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays === 1) {
                    consecutive_days++;
                    prevDate = currentDate;
                } else {
                    break; // 连续打卡中断
                }
            }
        }

        res.json({
            success: true,
            data: {
                monthly_count: parseInt(monthlyResult.rows[0].monthly_count),
                consecutive_days: consecutive_days
            }
        });
    } catch (error) {
        console.error('获取用户打卡统计失败:', error);
        res.status(500).json({ success: false, message: '服务器内部错误' });
    }
});

// 删除打卡记录
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 先获取要删除的记录信息（用于回滚积分）
        const recordResult = await pool.query(
            'SELECT user_id, points_earned FROM checkin_records WHERE id = $1',
            [id]
        );

        if (recordResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: '打卡记录不存在' });
        }

        const { user_id, points_earned } = recordResult.rows[0];

        // 删除打卡记录
        await pool.query(
            'DELETE FROM checkin_records WHERE id = $1',
            [id]
        );

        res.json({ success: true, message: '打卡记录删除成功' });
    } catch (error) {
        console.error('删除打卡记录失败:', error);
        res.status(500).json({ success: false, message: '服务器内部错误' });
    }
});

module.exports = router;