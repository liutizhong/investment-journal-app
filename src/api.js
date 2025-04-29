// 前端API请求封装，便于App.js调用后端服务
const API_BASE = 'http://127.0.0.1:4000/api';

export async function fetchJournals() {
  const res = await fetch(`${API_BASE}/journals`);
  if (!res.ok) throw new Error('获取日志失败');
  return res.json();
}

export async function addJournal(journal) {
  const res = await fetch(`${API_BASE}/journals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(journal)
  });
  if (!res.ok) throw new Error('保存日志失败');
  return res.json();
}

export async function deleteJournal(id) {
  const res = await fetch(`${API_BASE}/journals/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('删除日志失败');
  return res.json();
}

export async function generateAIReview(journal) {
  console.log('AI Review Prompt:', journal);
  const res = await fetch(`${API_BASE}/journals/${journal.id}/ai-review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(journal)
  });
  if (!res.ok) throw new Error('生成AI复盘失败');
  return res.json();
}