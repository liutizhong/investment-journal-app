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

export async function updateJournal(journal) {
  const res = await fetch(`${API_BASE}/journals/${journal.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(journal)
  });
  if (!res.ok) throw new Error('更新日志失败');
  return res.json();
}

export async function deleteJournal(id) {
  const res = await fetch(`${API_BASE}/journals/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('删除日志失败');
  return res.json();
}

export async function generateAIReview(journalId, reviewInput) {
  console.log('AI Review Input:', reviewInput);
  const res = await fetch(`${API_BASE}/journals/${journalId}/generate_ai_review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reviewInput) // Send only necessary data for AI review generation
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: '优化投资日志策略失败，无法解析错误信息' }));
    throw new Error(errorData.detail || '优化投资日志策略失败');
  }
  return res.json(); // Returns the newly created AIReviewLog
}

export async function addAIReviewLogManual(journalId, reviewContent) {
  const res = await fetch(`${API_BASE}/journals/${journalId}/ai_review_logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ review_content: reviewContent })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: '添加复盘日志失败，无法解析错误信息' }));
    throw new Error(errorData.detail || '添加复盘日志失败');
  }
  return res.json(); // Returns the newly created AIReviewLog
}