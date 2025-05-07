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
                ai_review TEXT,
                archived BOOLEAN DEFAULT FALSE
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
    archived: bool = False

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
async def get_journals(include_archived: bool = False):
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            if include_archived:
                records = await conn.fetch('SELECT * FROM journals ORDER BY id DESC')
            else:
                records = await conn.fetch('SELECT * FROM journals WHERE archived = FALSE ORDER BY id DESC')
            return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 新增日志
@app.post("/api/journals")
async def create_journal(journal: Journal):
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            #ai_review = await get_ai_review(journal)
            record = await conn.fetchrow(
                '''INSERT INTO journals 
                (date, asset, amount, price, strategy, reasons, risks, 
                expected_return, exit_plan, market_conditions, emotional_state, archived)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *''',
                journal.date, journal.asset, journal.amount, journal.price,
                journal.strategy, journal.reasons, journal.risks,
                journal.expected_return, journal.exit_plan, journal.market_conditions,
                journal.emotional_state, journal.archived
            )
            return record
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 更新日志
@app.put("/api/journals/{id}")
async def update_journal(id: int, journal: Journal):
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            update_result = await conn.fetchrow(
                '''UPDATE journals 
                SET date=$1, asset=$2, amount=$3, price=$4, strategy=$5, reasons=$6, risks=$7, 
                expected_return=$8, exit_plan=$9, market_conditions=$10, emotional_state=$11, archived=$12 
                WHERE id=$13 RETURNING *''',
                journal.date, journal.asset, journal.amount, journal.price,
                journal.strategy, journal.reasons, journal.risks,
                journal.expected_return, journal.exit_plan, journal.market_conditions,
                journal.emotional_state, journal.archived, id
            )
            
            if not update_result:
                raise HTTPException(status_code=404, detail="未找到指定ID的日志")
                
            return update_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 归档日志
@app.delete("/api/journals/{id}")
async def archive_journal(id: int):
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            update_result = await conn.fetchrow(
                'UPDATE journals SET archived = TRUE WHERE id=$1 RETURNING *', id
            )
            
            if not update_result:
                raise HTTPException(status_code=404, detail="未找到指定ID的日志")
                
            return {"success": True, "message": "日志已归档"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 获取已归档日志
@app.get("/api/journals/archived")
async def get_archived_journals():
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            records = await conn.fetch('SELECT * FROM journals WHERE archived = TRUE ORDER BY id DESC')
            return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 取消归档日志
@app.post("/api/journals/{id}/unarchive")
async def unarchive_journal(id: int):
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            update_result = await conn.fetchrow(
                'UPDATE journals SET archived = FALSE WHERE id=$1 RETURNING *', id
            )
            
            if not update_result:
                raise HTTPException(status_code=404, detail="未找到指定ID的日志")
                
            return {"success": True, "message": "日志已取消归档"}
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
    except Exception as e:
        # 记录错误但不抛出异常，与Node.js实现保持一致
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

# AI review生成逻辑
async def get_ai_review(journal: Journal) -> str:
    # 检查API KEY是否配置
    api_key = os.getenv('DASHSCOPE_API_KEY')
    if not api_key:
        print('DASHSCOPE_API_KEY环境变量未配置')
        return 'AI复盘生成失败，请确保已配置DASHSCOPE_API_KEY环境变量。'
        
    prompt = f"请根据以下投资日志内容，给出详细的复盘建议：\n资产：{journal.asset}\n数量：{journal.amount}\n价格：{journal.price}\n策略：{journal.strategy}\n理由：{journal.reasons}\n风险：{journal.risks}\n预期收益：{journal.expected_return}\n退出计划：{journal.exit_plan}\n市场状况：{journal.market_conditions}\n情绪状态：{journal.emotional_state}"
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
        print(f"AI复盘生成失败: {str(e)}")
        return 'AI复盘生成失败，请稍后重试。'