from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import asyncpg
import os
from openai import OpenAI
from pydantic import BaseModel

app = FastAPI()

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# PostgreSQL连接池
async def get_db_pool():
    return await asyncpg.create_pool(
        user='tzliu',
        host='127.0.0.1',
        database='investment_journal',
        password='tzliu',
        port=5432
    )

# 创建表（启动时）
@app.on_event("startup")
async def startup():
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS journals (
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
            );
        ''')

# 日志模型
class Journal(BaseModel):
    date: str
    asset: str
    amount: str
    price: str
    strategy: str
    reasons: str
    risks: str
    expected_return: str
    exit_plan: str
    market_conditions: str
    emotional_state: str
    ai_review: str | None = None

class AIReviewInput(BaseModel):
    """仅包含优化投资日志策略所需的必填字段"""
    date: str
    asset: str
    amount: str
    price: str
    strategy: str
    reasons: str
    risks: str
    expected_return: str
    exit_plan: str
    market_conditions: str
    emotional_state: str

# 获取所有日志
@app.get("/api/journals")
async def get_journals():
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            records = await conn.fetch('SELECT * FROM journals ORDER BY id DESC')
            return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 新增日志
@app.post("/api/journals")
async def create_journal(journal: Journal):
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            ai_review = await get_ai_review(journal)
            record = await conn.fetchrow(
                '''INSERT INTO journals 
                (date, asset, amount, price, strategy, reasons, risks, 
                expected_return, exit_plan, market_conditions, emotional_state, ai_review)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *''',
                journal.date, journal.asset, journal.amount, journal.price,
                journal.strategy, journal.reasons, journal.risks,
                journal.expectedReturn, journal.exitPlan, journal.marketConditions,
                journal.emotionalState, ai_review
            )
            return record
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 删除日志
@app.delete("/api/journals/{id}")
async def delete_journal(id: int):
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            await conn.execute('DELETE FROM journals WHERE id=$1', id)
            return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# AI复盘生成接口
@app.post("/api/journals/{id}/ai-review")
async def generate_ai_review(id: int, journal: AIReviewInput):
    """
    Generate AI review for existing journal entry
    """
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            ai_review = await get_ai_review(journal)
            await conn.execute('UPDATE journals SET ai_review=$1 WHERE id=$2', ai_review, id)
            record = await conn.fetchrow('SELECT * FROM journals WHERE id=$1', id)
            return record
    except ValueError as e:
        # 捕获get_ai_review抛出的详细错误
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # 记录其他类型错误的完整堆栈信息
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")

# AI review生成逻辑
async def get_ai_review(journal: Journal) -> str:
    # 检查API KEY是否配置
    api_key = os.getenv('DASHSCOPE_API_KEY')
    if not api_key:
        raise ValueError('DASHSCOPE_API_KEY环境变量未配置')
        
    prompt = f"请根据以下投资日志内容，给出详细的投资建议，并指出投资日志描述的不足之处：\n资产：{journal.asset}\n数量：{journal.amount}\n价格：{journal.price}\n策略：{journal.strategy}\n理由：{journal.reasons}\n风险：{journal.risks}\n预期收益：{journal.expected_return}\n退出计划：{journal.exit_plan}\n市场状况：{journal.market_conditions}\n情绪状态：{journal.emotional_state}"
    print(f"优化投资日志策略提示: {prompt}")
    
    try:
        client = OpenAI(
            api_key=api_key,
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
        )
        
        completion = client.chat.completions.create(
            model="deepseek-v3",
            messages=[{'role': 'user', 'content': prompt}],
            max_tokens=8192
        )
        
        ai_review = completion.choices[0].message.content
        print(f"成功优化投资日志策略: {ai_review}")
        return ai_review
                
    except Exception as e:
        print(f"网络请求错误: {str(e)}")
        raise ValueError(f"网络请求失败: {str(e)}")
    except ValueError as e:
        print(f"API处理错误: {str(e)}")
        raise
    except Exception as e:
        print(f"未知错误: {str(e)}")
        raise ValueError(f"AI复盘生成失败: {str(e)}")