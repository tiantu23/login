// 引入pg库用于直接连接PostgreSQL数据库
const { Pool } = require('pg');

// PostgreSQL连接配置（直接写死，不再依赖环境变量）
const POSTGRES_URL = 'postgresql://postgres.cvpjfjpcwyujcnwmnpci:n7mMOZcLilnsfxq9@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

// 【关键修改1】删除环境变量校验（避免报错）
// 注释掉这部分：if (!POSTGRES_URL) { throw new Error('POSTGRES_URL环境变量未设置'); }

// 创建数据库连接池
console.log('正在创建PostgreSQL连接池...');
console.log(`PostgreSQL URL: ${POSTGRES_URL}`);

const pool = new Pool({
  connectionString: POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false // 忽略SSL证书验证
  }
});

// 【关键修改2】新增poolPromise（适配app.js和user.js的await poolPromise调用）
const poolPromise = new Promise((resolve, reject) => {
  pool.connect((err, client, done) => {
    if (err) {
      console.error('数据库连接池初始化失败:', err.stack);
      reject(err);
    } else {
      console.log('数据库连接池初始化成功');
      done(); // 释放临时连接
      resolve(pool);
    }
  });
});

// 创建一个模拟Supabase客户端的对象，提供与原来相同的接口
const supabase = {
  from: (tableName) => {
    return {
      // 查询方法
      select: (columns) => {
        // 基本查询对象，支持order方法（无条件查询）
        const baseQuery = {
          order: (field, options) => {
            // 执行无条件排序查询
            return new Promise(async (resolve, reject) => {
              try {
                const orderDirection = options.ascending ? 'ASC' : 'DESC';
                const query = `SELECT ${columns} FROM ${tableName} ORDER BY ${field} ${orderDirection}`;
                const { rows } = await pool.query(query);
                resolve({ data: rows, error: null });
              } catch (err) {
                resolve({ data: null, error: err });
              }
            });
          }
        };
        
        // 添加eq方法支持
        baseQuery.eq = (column, value) => {
          // 构建条件数组
          const conditions = [{ column, value }];
          
          const buildQuery = (additionalConditions = []) => {
            const allConditions = [...conditions, ...additionalConditions];
            const whereClause = allConditions.map((cond, index) => `${cond.column} = $${index + 1}`).join(' AND ');
            const params = allConditions.map(cond => cond.value);
            return { whereClause, params };
          };
          
          const result = {
            limit: (limit) => {
              // 执行带条件的查询
              return new Promise(async (resolve, reject) => {
                try {
                  const { whereClause, params } = buildQuery();
                  const query = `SELECT ${columns} FROM ${tableName} WHERE ${whereClause} LIMIT ${limit}`;
                  const { rows } = await pool.query(query, params);
                  resolve({ data: rows, error: null });
                } catch (err) {
                  resolve({ data: null, error: err });
                }
              });
            },
            order: (field, options) => {
              // 执行带条件的排序查询
              return new Promise(async (resolve, reject) => {
                try {
                  const { whereClause, params } = buildQuery();
                  const orderDirection = options.ascending ? 'ASC' : 'DESC';
                  const query = `SELECT ${columns} FROM ${tableName} WHERE ${whereClause} ORDER BY ${field} ${orderDirection}`;
                  const { rows } = await pool.query(query, params);
                  resolve({ data: rows, error: null });
                } catch (err) {
                  resolve({ data: null, error: err });
                }
              });
            },
            // 支持链式调用多个eq方法
            eq: (nextColumn, nextValue) => {
              conditions.push({ column: nextColumn, value: nextValue });
              return result;
            },
            // 添加single属性支持（适配Supabase 2.0+）
            single: new Promise(async (resolve, reject) => {
              try {
                const { whereClause, params } = buildQuery();
                const query = `SELECT ${columns} FROM ${tableName} WHERE ${whereClause} LIMIT 1`;
                const { rows } = await pool.query(query, params);
                resolve({ data: rows[0] || null, error: null });
              } catch (err) {
                resolve({ data: null, error: err });
              }
            }),
            // 支持直接执行查询（当没有调用limit、order等方法时）
            then: async (callback) => {
              try {
                const { whereClause, params } = buildQuery();
                const query = `SELECT ${columns} FROM ${tableName} WHERE ${whereClause}`;
                const { rows } = await pool.query(query, params);
                return callback({ data: rows, error: null });
              } catch (err) {
                console.error('查询数据错误:', err);
                return callback({ data: null, error: err });
              }
            }
          };
          
          // 支持直接await查询
          return result;
        };
        
        return baseQuery;
      },
      // 插入方法
      insert: (dataArray) => {
        return {
            select: (columns) => {
                return new Promise(async (resolve, reject) => {
                    try {
                        // 处理批量插入
                        if (!Array.isArray(dataArray)) {
                            dataArray = [dataArray];
                        }
                        
                        // 获取列名
                        const keys = Object.keys(dataArray[0]);
                        const columnNames = keys.join(', ');
                        
                        // 构建值的占位符和参数
                        const placeholders = dataArray.map((_, rowIndex) => {
                            return '(' + keys.map((_, colIndex) => `$${rowIndex * keys.length + colIndex + 1}`).join(', ') + ')';
                        }).join(', ');
                        
                        // 构建参数数组
                        const params = [];
                        dataArray.forEach(data => {
                            params.push(...Object.values(data));
                        });
                        
                        // 处理columns参数，为空时返回所有列
                        const returnColumns = columns ? columns : '*';
                        
                        // 执行插入查询
                        const query = `INSERT INTO ${tableName} (${columnNames}) VALUES ${placeholders} RETURNING ${returnColumns}`;
                        const { rows } = await pool.query(query, params);
                        
                        resolve({ data: rows, error: null });
                    } catch (err) {
                        console.error('插入数据错误:', err);
                        resolve({ data: null, error: err });
                    }
                });
            }
        };
      },
      // 更新方法
      update: (updateData) => {
        return {
          eq: (column, value) => {
            return {
              select: (columns) => {
                return new Promise(async (resolve, reject) => {
                  try {
                    // 获取更新的列名和值
                    const keys = Object.keys(updateData);
                    const columnUpdates = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
                    
                    // 构建参数数组
                    const params = Object.values(updateData);
                    params.push(value); // 添加WHERE条件的值
                    
                    // 处理columns参数，为空时返回所有列
                    const returnColumns = columns ? columns : '*';
                    
                    // 执行更新查询
                    const query = `UPDATE ${tableName} SET ${columnUpdates} WHERE ${column} = $${params.length} RETURNING ${returnColumns}`;
                    const { rows } = await pool.query(query, params);
                    
                    resolve({ data: rows, error: null });
                  } catch (err) {
                    console.error('更新数据错误:', err);
                    resolve({ data: null, error: err });
                  }
                });
              },
              limit: (limit) => {
                return {
                  select: (columns) => {
                    return new Promise(async (resolve, reject) => {
                      try {
                        // 获取更新的列名和值
                        const keys = Object.keys(updateData);
                        const columnUpdates = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
                        
                        // 构建参数数组
                        const params = Object.values(updateData);
                        params.push(value); // 添加WHERE条件的值
                        
                        // 处理columns参数，为空时返回所有列
                        const returnColumns = columns ? columns : '*';
                        
                        // 执行更新查询
                        const query = `UPDATE ${tableName} SET ${columnUpdates} WHERE ${column} = $${params.length} LIMIT ${limit} RETURNING ${returnColumns}`;
                        const { rows } = await pool.query(query, params);
                        
                        resolve({ data: rows, error: null });
                      } catch (err) {
                        console.error('更新数据错误:', err);
                        resolve({ data: null, error: err });
                      }
                    });
                  }
                };
              }
            };
          }
        };
      },
      // 删除方法
      delete: () => {
        // 构建条件数组
        const conditions = [];
        
        const buildQuery = () => {
          const whereClause = conditions.map((cond, index) => `${cond.column} = $${index + 1}`).join(' AND ');
          const params = conditions.map(cond => cond.value);
          return { whereClause, params };
        };
        
        const result = {
          eq: (column, value) => {
            conditions.push({ column, value });
            return result;
          },
          // 执行删除操作
          then: async (callback) => {
            try {
              const { whereClause, params } = buildQuery();
              const query = `DELETE FROM ${tableName} WHERE ${whereClause}`;
              const { rows } = await pool.query(query, params);
              return callback({ data: rows, error: null });
            } catch (err) {
              console.error('删除数据错误:', err);
              return callback({ data: null, error: err });
            }
          }
        };
        
        // 支持直接执行（当没有链式调用时）
        return result;
      }
    };
  }
};

// 测试数据库连接
async function testConnection() {
  try {
    console.log('正在测试PostgreSQL连接...');
    
    // 尝试执行一个简单的查询来测试连接
    const { rows } = await pool.query('SELECT NOW()');
    
    console.log('PostgreSQL连接成功！');
    console.log('当前时间:', rows[0].now);
    return supabase;
  } catch (err) {
    console.error('PostgreSQL连接测试失败：', JSON.stringify(err, null, 2));
    return null;
  }
}

// 【关键修改3】补充poolPromise导出（适配app.js和user.js）
module.exports = {
  supabase,
  testConnection,
  pool, // 导出原始的pool对象
  poolPromise // 新增导出poolPromise
};