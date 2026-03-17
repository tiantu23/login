const express = require('express');
const router = express.Router();
const bcryptjs = require('bcryptjs'); // 引入bcryptjs用于密码哈希比较
const { supabase } = require('../db'); // 引入Supabase配置
const { sendRegisterCode, sendVerifyCode } = require('../../util/emailUtil');
const { saveRegisterCode, verifyRegisterCode, saveCode, verifyCode, deleteCode } = require('../../util/codeCacheUtil');


router.post('/send-register-code', async (req, res) => {
  try {
    const { email } = req.body;
    // 前端已校验，后端二次校验邮箱格式
    const emailReg = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
    if (!email || !emailReg.test(email)) {
      return res.json({ success: false, message: '请输入正确的邮箱格式' });
    }

    // 校验邮箱是否已注册
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single;
    if (user) {
      return res.json({ success: false, message: '该邮箱已注册' });
    }

    // 发送验证码
    const emailResult = await sendRegisterCode(email);
    if (!emailResult.success) {
      return res.json({ success: false, message: emailResult.message });
    }

    // 缓存验证码
    saveRegisterCode(email, emailResult.code);
    res.json({ success: true, message: '验证码已发送至邮箱，5分钟内有效' });
  } catch (error) {
    console.error('发送注册验证码失败:', error);
    res.json({ success: false, message: '服务器异常，请重试' });
  }
});

// 测试Supabase连接的路由
router.get('/test-db', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('*').limit(1);
    if (error) {
      return res.status(500).json({ success: false, message: 'Supabase连接失败', error: error.message });
    }
    res.json({ success: true, message: 'Supabase连接成功' });
  } catch (err) {
    console.error('Supabase连接测试失败:', err);
    res.status(500).json({ success: false, message: 'Supabase连接测试失败', error: err.message });
  }
});

// 用户注册路由（包含验证码验证）
router.post('/register', async (req, res) => {
  try {
    const { username, password, nickname, email, phone, birthday, city, code } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码是必填项' });
    }
    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ success: false, message: '用户名长度必须在3-50个字符之间' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: '密码长度不能少于6个字符' });
    }

    // 如果提供了邮箱，需要验证验证码
    if (email) {
      if (!code) {
        return res.status(400).json({ success: false, message: '邮箱注册需要验证码' });
      }
      // 验证验证码
      const isCodeValid = verifyRegisterCode(email, code);
      if (!isCodeValid) {
        return res.status(400).json({ success: false, message: '验证码错误或已过期' });
      }
    }

    const { data: existingUserByUsername, error: usernameError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .limit(1);
    
    if (usernameError) throw usernameError;
    if (existingUserByUsername && existingUserByUsername.length > 0) {
      return res.status(400).json({ success: false, message: '用户名已被使用' });
    }

    if (email) {
      const { data: existingUserByEmail, error: emailError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .limit(1);
      if (emailError) throw emailError;
      if (existingUserByEmail && existingUserByEmail.length > 0) {
        return res.status(400).json({ success: false, message: '邮箱已被注册' });
      }
    }

    if (phone) {
      const { data: existingUserByPhone, error: phoneError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .limit(1);
      if (phoneError) throw phoneError;
      if (existingUserByPhone && existingUserByPhone.length > 0) {
        return res.status(400).json({ success: false, message: '手机号已被注册' });
      }
    }

    // 确保bcryptjs已安装，直接使用顶部导入的bcryptjs
    const hashedPassword = await bcryptjs.hash(password, 10);
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{
        username,
        password: hashedPassword,
        nickname: nickname || '',
        email: email || null,
        phone: phone || null,
        birthday: birthday || null,
        city: city || null
      }])
      .select('id, username, nickname, email, phone, birthday, city, created_at');
    
    if (insertError) throw insertError;
    if (!newUser || newUser.length === 0) {
      return res.status(500).json({ success: false, message: '用户创建失败' });
    }

    res.json({
      success: true,
      message: '注册成功',
      user: {
        id: newUser[0].id,
        username: newUser[0].username,
        nickname: newUser[0].nickname,
        email: newUser[0].email,
        phone: newUser[0].phone,
        birthday: newUser[0].birthday,
        city: newUser[0].city,
        create_time: newUser[0].created_at
      }
    });
  } catch (err) {
    console.error('注册失败:', err);
    res.status(500).json({ success: false, message: '注册失败', error: err.message });
  }
});

// 用户登录路由
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .limit(1);
    
    if (userError) throw userError;
    if (!user || user.length === 0) {
      return res.status(400).json({ success: false, message: '用户名不存在' });
    }

    let isPasswordCorrect;
    if (user[0].password.startsWith('$2b$')) {
      isPasswordCorrect = await bcryptjs.compare(password, user[0].password);
    } else {
      isPasswordCorrect = password === user[0].password;
      if (isPasswordCorrect) {
        const hashedPassword = await bcryptjs.hash(password, 10);
        const { error: updatePwdError } = await supabase
          .from('users')
          .update({ password: hashedPassword })
          .eq('id', user[0].id);
        if (updatePwdError) console.error('更新密码失败:', updatePwdError);
      }
    }

    if (!isPasswordCorrect) {
      return res.status(400).json({ success: false, message: '密码错误' });
    }

    res.json({
      success: true,
      message: '登录成功',
      user: {
        id: user[0].id,
        username: user[0].username,
        nickname: user[0].nickname,
        email: user[0].email,
        phone: user[0].phone,
        birthday: user[0].birthday,
        city: user[0].city,
        avatar: user[0].avatar
      }
    });
  } catch (err) {
    console.error('登录失败:', err);
    res.status(500).json({ success: false, message: '登录接口内部错误', error: err.message });
  }
});

// 用户信息获取接口（修复.single()问题）
router.get('/info/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log('获取用户信息，用户ID:', userId);

    // 获取用户基本信息，包括创建时间
    const { data: userList, error: userError } = await supabase
      .from('users')
      .select('id, username, nickname, email, phone, birthday, city, avatar, created_at')
      .eq('id', userId)
      .limit(1);
    
    if (userError) throw userError;
    const user = userList && userList.length > 0 ? userList[0] : null;
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    // 获取用户的动态数量
    const { count: dynamicCount, error: dynamicError } = await supabase
      .from('post')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);
    
    if (dynamicError) throw dynamicError;

    // 获取用户的累计减排量（假设用户表中有carbon_reduction字段）
    // 如果用户表中没有这个字段，可以根据动态数据计算
    const carbonReduction = user.carbon_reduction || 0;

    res.json({ 
      success: true, 
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        phone: user.phone,
        birthday: user.birthday,
        city: user.city,
        avatar: user.avatar || null,
        created_at: user.created_at,
        dynamic_count: dynamicCount || 0,
        carbon_reduction: carbonReduction
      } 
    });
  } catch (err) {
    console.error('获取用户信息失败:', err);
    res.status(500).json({ success: false, message: '获取用户信息失败', error: err.message });
  }
});

// 用户信息更新接口（适配Supabase v1版本，终极兼容）
router.put('/update/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { nickname, email, phone, birthday, city } = req.body;

    // ************ 核心修复：v1版本Supabase更新语法 ************
    // v1版本更新需要用对象包裹，且不支持链式.eq()/.match()，需用filter
    const updateData = {};
    // 只更新有值的字段，避免覆盖为null或空字符串
    if (nickname !== undefined && nickname !== '') updateData.nickname = nickname;
    if (email !== undefined && email !== '') updateData.email = email;
    if (phone !== undefined && phone !== '') updateData.phone = phone;
    if (birthday !== undefined && birthday !== '') updateData.birthday = birthday;
    if (city !== undefined && city !== '') updateData.city = city;

    // 使用我们实现的update方法语法：from + update + eq + select
    const { data, error: updateError } = await supabase.from('users')
      .update(updateData)
      .eq('id', userId)
      .select('*');

    if (updateError) {
      console.error('Supabase更新错误:', updateError);
      throw updateError;
    }

    // 更新后重新查询用户信息返回
    const { data: userList, error: queryError } = await supabase
      .from('users')
      .select('id, username, nickname, email, phone, birthday, city')
      .eq('id', userId) // 使用我们实现的eq方法
      .limit(1);
    
    if (queryError) throw queryError;
    const user = userList && userList.length > 0 ? userList[0] : null;
    
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    res.json({ 
      success: true, 
      message: '用户信息更新成功',
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        phone: user.phone,
        birthday: user.birthday,
        city: user.city
      } 
    });
  } catch (err) {
    console.error('更新用户信息失败:', err);
    res.status(500).json({ 
      success: false, 
      message: '更新用户信息失败', 
      error: err.message 
    });
  }
});

// 验证旧密码接口（修复加密密码验证+精准日志）
router.post('/:userId/verify-password', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { password } = req.body;

    console.log('===== 验证旧密码 =====');
    console.log('用户ID:', userId);
    console.log('前端传入的密码:', password);

    // 使用我们实现的eq方法查询用户
    const { data: userList, error: userError } = await supabase
      .from('users')
      .select('password')
      .eq('id', userId)
      .limit(1);

    // 打印查询结果，方便排查
    console.log('查询用户结果:', userList);
    console.log('查询错误:', userError);

    if (userError) {
      console.error('查询用户失败:', userError.message);
      return res.status(500).json({ success: false, message: '查询用户失败' });
    }

    if (!userList || userList.length === 0) {
      console.error('用户不存在，ID:', userId);
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const user = userList[0];
    console.log('数据库中的加密密码:', user.password);

    // 核心修复2：精准验证加密密码（加日志）
    let isCorrect = false;
    try {
      isCorrect = await bcryptjs.compare(password, user.password); // 修改：bcryptjs → bcryptjs
      console.log('密码验证结果:', isCorrect);
    } catch (bcryptjsError) {
      console.error('bcryptjs验证失败:', bcryptjsError.message);
      return res.status(500).json({ success: false, message: '密码验证算法出错' });
    }

    // 返回精准结果
    if (isCorrect) {
      res.json({ success: true });
    } else {
      res.json({ success: false, message: '旧密码错误' });
    }

  } catch (err) {
    console.error('验证旧密码总异常:', err.stack); // 打印完整堆栈
    res.status(500).json({ success: false, message: `验证失败：${err.message}` });
  }
});

// 修改密码接口
router.put('/:userId/update-password', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { oldPassword, newPassword } = req.body;

    console.log('接收到修改密码请求:', { userId, oldPassword, newPassword });

    // 1. 验证输入
    if (!oldPassword || !newPassword) {
      console.error('旧密码或新密码不能为空:', { oldPassword, newPassword });
      return res.status(400).json({ success: false, message: '旧密码和新密码不能为空' });
    }

    // 2. 验证旧密码
    const { data: userList, error: userError } = await supabase
      .from('users')
      .select('password')
      .eq('id', userId)
      .limit(1);

    console.log('查询用户结果:', { userList, userError });

    if (userError) {
      console.error('查询用户失败:', userError.message);
      return res.status(500).json({ success: false, message: '查询用户失败' });
    }

    if (!userList || userList.length === 0) {
      console.error('用户不存在:', userId);
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const user = userList[0];
    const isPasswordCorrect = await bcryptjs.compare(oldPassword, user.password); // 修改：bcryptjs → bcryptjs

    console.log('旧密码验证结果:', isPasswordCorrect);

    if (!isPasswordCorrect) {
      console.error('旧密码错误');
      return res.status(400).json({ success: false, message: '旧密码错误' });
    }

    // 新密码不能和旧密码相同
    const isNewPasswordSameAsOld = await bcryptjs.compare(newPassword, user.password); // 修改：bcryptjs → bcryptjs
    console.log('新密码与旧密码是否相同:', isNewPasswordSameAsOld);
    if (isNewPasswordSameAsOld) {
      console.error('新密码不能和旧密码相同');
      return res.status(400).json({ success: false, message: '新密码不能和旧密码相同' });
    }

    // 3. 更新密码
    const hashedPassword = await bcryptjs.hash(newPassword, 10); // 修改：bcryptjs → bcryptjs
    console.log('新密码加密后:', hashedPassword);
    
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', userId)
      .select(); // 添加select()以返回更新后的数据

    console.log('更新密码结果:', { updateData, updateError });

    if (updateError) {
      console.error('更新密码失败:', updateError.message);
      return res.status(500).json({ success: false, message: '更新密码失败' });
    }

    console.log('密码修改成功:', updateData);
    res.json({ success: true, message: '密码修改成功' });
  } catch (err) {
    console.error('修改密码失败:', err);
    res.status(500).json({ success: false, message: '修改密码失败' });
  }
});

// 检查用户名、手机号或邮箱是否已存在的接口
router.get('/check-existence', async (req, res) => {
  try {
    const { type, value } = req.query;
    
    // 验证参数
    if (!type || !value) {
      return res.status(400).json({ 
        success: false, 
        message: '缺少必要参数',
        data: { exists: false }
      });
    }
    
    // 只允许检查指定字段
    const allowedTypes = ['username', 'phone', 'email'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: '无效的检查类型',
        data: { exists: false }
      });
    }
    
    // 查询数据库
    const { data: userList, error } = await supabase
      .from('users')
      .select('id')
      .eq(type, value)
      .limit(1);
    
    if (error) {
      console.error('检查字段存在性失败:', error.message);
      return res.status(500).json({ 
        success: false, 
        message: '服务器内部错误',
        data: { exists: false }
      });
    }
    
    // 判断是否存在
    const exists = userList && userList.length > 0;
    
    res.json({
      success: true,
      message: exists ? `${type === 'username' ? '用户名' : type === 'phone' ? '手机号' : '邮箱'}已存在` : `${type === 'username' ? '用户名' : type === 'phone' ? '手机号' : '邮箱'}可用`,
      data: { exists }
    });
    
  } catch (err) {
    console.error('检查字段存在性时发生错误:', err);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误',
      data: { exists: false }
    });
  }
});

// 注销账户接口（适配Supabase v1，带密码验证+详细日志）
router.delete('/:userId/delete-account', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { password } = req.body; // 注销前验证密码，避免误操作

    console.log('===== 注销账户 =====');
    console.log('用户ID:', userId);

    // 步骤1：查询用户并验证密码（必须！防止恶意注销）
    const { data: userList, error: userError } = await supabase
      .from('users')
      .select('password')
      .eq('id', userId) // v2版本使用eq方法
      .limit(1);

    console.log('查询用户结果:', userList);
    console.log('查询错误:', userError);

    if (userError) {
      console.error('查询用户失败:', userError.message);
      return res.status(500).json({ 
        success: false, 
        message: '查询用户失败：' + userError.message 
      });
    }

    if (!userList || userList.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }

    // 步骤2：验证密码（加密密码验证）
    const user = userList[0];
    let isPwdCorrect = false;
    try {
      isPwdCorrect = await bcryptjs.compare(password, user.password); // 修改：bcryptjs → bcryptjs
      console.log('密码验证结果:', isPwdCorrect);
    } catch (bcryptjsError) {
      console.error('密码验证失败:', bcryptjsError.message);
      return res.status(500).json({ 
        success: false, 
        message: '密码验证出错：' + bcryptjsError.message 
      });
    }

    if (!isPwdCorrect) {
      return res.status(400).json({ 
        success: false, 
        message: '密码错误，无法注销账户' 
      });
    }

    // 步骤3：删除用户（Supabase v2删除语法）
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    console.log('删除用户错误:', deleteError);

    if (deleteError) {
      console.error('注销账户失败:', deleteError.message);
      return res.status(500).json({ 
        success: false, 
        message: '注销失败：' + deleteError.message 
      });
    }

    // 步骤4：返回成功结果
    res.json({ 
      success: true, 
      message: '账户注销成功！' 
    });

  } catch (err) {
    console.error('注销账户总异常:', err.stack);
    res.status(500).json({ 
      success: false, 
      message: '注销失败：' + err.message 
    });
  }
});

// ===================== 忘记密码相关API =====================

// 检查邮箱是否存在（用于忘记密码第一步）
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    // 验证邮箱格式
    const emailReg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!email || !emailReg.test(email)) {
      return res.status(400).json({ success: false, message: '邮箱格式错误' });
    }
    
    // 查询数据库
    const { data: userList, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1);
    
    if (error) {
      console.error('检查邮箱失败:', error.message);
      return res.status(500).json({ success: false, message: '服务器错误' });
    }
    
    // 判断邮箱是否存在
    if (userList && userList.length > 0) {
      res.json({ success: true, message: '邮箱存在' });
    } else {
      res.json({ success: false, message: '邮箱不存在' });
    }
  } catch (err) {
    console.error('检查邮箱异常:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 发送重置密码验证码
router.post('/send-reset-code', async (req, res) => {
  try {
    const { email } = req.body;
    
    // 验证邮箱格式
    const emailReg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!email || !emailReg.test(email)) {
      return res.status(400).json({ success: false, message: '邮箱格式错误' });
    }
    
    // 查询数据库确认邮箱存在
    const { data: userList, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1);
    
    if (error) {
      console.error('查询用户失败:', error.message);
      return res.status(500).json({ success: false, message: '服务器错误' });
    }
    
    if (!userList || userList.length === 0) {
      return res.status(404).json({ success: false, message: '邮箱不存在' });
    }
    
    // 发送验证码邮件
    const emailResult = await sendVerifyCode(email, 'password');
    if (!emailResult.success) {
      return res.status(500).json({ success: false, message: '发送验证码失败' });
    }
    
    // 保存验证码到缓存
    saveCode(email, emailResult.code);
    
    res.json({ success: true, message: '验证码已发送' });
  } catch (err) {
    console.error('发送验证码异常:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 验证重置密码验证码
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ success: false, message: '参数错误' });
    }
    
    // 验证验证码
    const isValid = verifyCode(email, code);
    if (!isValid) {
      return res.status(400).json({ success: false, message: '验证码错误或已过期' });
    }
    
    // 验证成功后删除验证码
    deleteCode(email);
    
    res.json({ success: true, message: '验证码验证成功' });
  } catch (err) {
    console.error('验证验证码异常:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 重置密码
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    
    // 验证参数
    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: '参数错误' });
    }
    
    // 验证密码格式
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: '密码长度不能少于6位' });
    }
    
    // 查询数据库确认邮箱存在
    const { data: userList, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1);
    
    if (userError) {
      console.error('查询用户失败:', userError.message);
      return res.status(500).json({ success: false, message: '服务器错误' });
    }
    
    if (!userList || userList.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    // 密码哈希
    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    
    // 更新密码
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('email', email);
    
    if (updateError) {
      console.error('更新密码失败:', updateError.message);
      return res.status(500).json({ success: false, message: '密码重置失败' });
    }
    
    res.json({ success: true, message: '密码重置成功' });
  } catch (err) {
    console.error('重置密码异常:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 必须导出router，否则app.js无法使用
module.exports = router;