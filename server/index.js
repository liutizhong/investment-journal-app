// 简单Node.js/Express后端，负责处理投资日志存取和AI review生成
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// PostgreSQL连接配置（请根据实际情况修改）
const pool = new Pool({
  user: 'tzliu',
  host: '127.0.0.1',
  database: 'investment_journal',
  password: 'tzliu',
  port: 5432,
});

// 创建表（如未存在）
pool.query(`CREATE TABLE IF NOT EXISTS journals (
  id SERIAL PRIMARY KEY,
  date VARCHAR(20),
  asset VARCHAR(100),
  amount VARCHAR(50),
  price VARCHAR(50),
  strategy VARCHAR(50),
  reasons TEXT,
  risks TEXT,
  expected_return VARCHAR(50),
  exit_plan VARCHAR(100),
  market_conditions TEXT,
  emotional_state VARCHAR(100),
  ai_review TEXT
);`);

// 获取所有日志
app.get('/api/journals', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM journals ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 新增日志并生成AI复盘
app.post('/api/journals', async (req, res) => {
  const journal = req.body;
  try {
    // 调用AI API生成review
    const aiReview = await getAIReview(journal);
    const insertResult = await pool.query(
      'INSERT INTO journals (date, asset, amount, price, strategy, reasons, risks, expected_return, exit_plan, market_conditions, emotional_state, ai_review) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',
      [journal.date, journal.asset, journal.amount, journal.price, journal.strategy, journal.reasons, journal.risks, journal.expectedReturn, journal.exitPlan, journal.marketConditions, journal.emotionalState, aiReview]
    );
    res.json(insertResult.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 删除日志
app.delete('/api/journals/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM journals WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI review生成逻辑（调用OpenAI API，需配置API KEY）
async function getAIReview(journal) {
  const prompt = `请根据以下投资日志内容，给出详细的复盘建议：\n资产：${journal.asset}\n数量：${journal.amount}\n价格：${journal.price}\n策略：${journal.strategy}\n理由：${journal.reasons}\n风险：${journal.risks}\n预期收益：${journal.expectedReturn}\n退出计划：${journal.exitPlan}\n市场状况：${journal.marketConditions}\n情绪状态：${journal.emotionalState}`;
  try {
    // 调用阿里云deepseek r1（兼容OpenAI API）
    const response = await axios.post('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data.choices[0].message.content;
  } catch (err) {
    return 'AI复盘生成失败，请稍后重试。';
  }
}

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});