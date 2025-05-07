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
        # 创建主表
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
                archived BOOLEAN DEFAULT FALSE,
                exit_date VARCHAR(20)
            );
        ''')
        # 创建卖出记录表
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS sell_records (
                id SERIAL PRIMARY KEY,
                journal_id INTEGER REFERENCES journals(id) ON DELETE CASCADE,
                date VARCHAR(20),
                price VARCHAR(50),
                amount VARCHAR(50),
                reason TEXT
            );
        ''')

# 卖出记录模型
class SellRecordCreate(BaseModel):
    date: str
    price: str
    amount: str
    reason: str

class SellRecord(SellRecordCreate):
    id: int
    journal_id: int

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
    exit_date: str | None = None
    sell_records: list[SellRecordCreate] | None = [] # 用于创建和更新时接收数据

class JournalResponse(Journal):
    id: int
    sell_records: list[SellRecord] | None = [] # 用于响应时包含完整的卖出记录信息

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
@app.get("/api/journals", response_model=list[JournalResponse])
async def get_journals(include_archived: bool = False):
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            query = 'SELECT * FROM journals'
            if not include_archived:
                query += ' WHERE archived = FALSE'
            query += ' ORDER BY id DESC'
            journal_records = await conn.fetch(query)
            
            result = []
            for journal_data in journal_records:
                sell_records_data = await conn.fetch('SELECT * FROM sell_records WHERE journal_id = $1', journal_data['id'])
                journal_dict = dict(journal_data)
                journal_dict['sell_records'] = [dict(sr) for sr in sell_records_data]
                result.append(JournalResponse(**journal_dict))
            return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 新增日志
@app.post("/api/journals", response_model=JournalResponse)
async def create_journal(journal: Journal):
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.transaction():
                # 插入主日志条目
                journal_record = await conn.fetchrow(
                    '''INSERT INTO journals 
                    (date, asset, amount, price, strategy, reasons, risks, 
                    expected_return, exit_plan, market_conditions, emotional_state, archived, exit_date)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                    RETURNING *''',
                    journal.date, journal.asset, journal.amount, journal.price,
                    journal.strategy, journal.reasons, journal.risks,
                    journal.expected_return, journal.exit_plan, journal.market_conditions,
                    journal.emotional_state, journal.archived, journal.exit_date
                )
                journal_id = journal_record['id']
                
                # 插入卖出记录
                created_sell_records = []
                if journal.sell_records:
                    for sr_data in journal.sell_records:
                        sell_record = await conn.fetchrow(
                            '''INSERT INTO sell_records (journal_id, date, price, amount, reason)
                            VALUES ($1, $2, $3, $4, $5) RETURNING *''',
                            journal_id, sr_data.date, sr_data.price, sr_data.amount, sr_data.reason
                        )
                        created_sell_records.append(dict(sell_record))
                
                response_data = dict(journal_record)
                response_data['sell_records'] = created_sell_records
                return JournalResponse(**response_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 更新日志
@app.put("/api/journals/{id}", response_model=JournalResponse)
async def update_journal(id: int, journal: Journal):
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            async with conn.transaction():
                # 更新主日志条目
                journal_update_result = await conn.fetchrow(
                    '''UPDATE journals 
                    SET date=$1, asset=$2, amount=$3, price=$4, strategy=$5, reasons=$6, risks=$7, 
                    expected_return=$8, exit_plan=$9, market_conditions=$10, emotional_state=$11, ai_review=$12, archived=$13, 
                    exit_date=$14 
                    WHERE id=$15 RETURNING *''',
                    journal.date, journal.asset, journal.amount, journal.price,
                    journal.strategy, journal.reasons, journal.risks,
                    journal.expected_return, journal.exit_plan, journal.market_conditions,
                    journal.emotional_state, journal.ai_review, journal.archived, journal.exit_date, id
                )
                
                if not journal_update_result:
                    raise HTTPException(status_code=404, detail="未找到指定ID的日志")
                
                # 删除旧的卖出记录
                await conn.execute('DELETE FROM sell_records WHERE journal_id = $1', id)
                
                # 插入新的卖出记录
                updated_sell_records = []
                if journal.sell_records:
                    for sr_data in journal.sell_records:
                        sell_record = await conn.fetchrow(
                            '''INSERT INTO sell_records (journal_id, date, price, amount, reason)
                            VALUES ($1, $2, $3, $4, $5) RETURNING *''',
                            id, sr_data.date, sr_data.price, sr_data.amount, sr_data.reason
                        )
                        updated_sell_records.append(dict(sell_record))
                
                response_data = dict(journal_update_result)
                response_data['sell_records'] = updated_sell_records
                return JournalResponse(**response_data)
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
@app.get("/api/journals/archived", response_model=list[JournalResponse])
async def get_archived_journals():
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            journal_records = await conn.fetch('SELECT * FROM journals WHERE archived = TRUE ORDER BY id DESC')
            result = []
            for journal_data in journal_records:
                sell_records_data = await conn.fetch('SELECT * FROM sell_records WHERE journal_id = $1', journal_data['id'])
                journal_dict = dict(journal_data)
                journal_dict['sell_records'] = [dict(sr) for sr in sell_records_data]
                result.append(JournalResponse(**journal_dict))
            return result
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