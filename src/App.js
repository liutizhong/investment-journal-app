import React, { useState, useEffect } from 'react';
import { Save, Trash2, FileText, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { fetchJournals, addJournal, deleteJournal, generateAIReview } from './api';

// 主应用组件
export default function InvestmentJournal() {
  // 状态管理
  const [journals, setJournals] = useState([]);
  const [currentJournal, setCurrentJournal] = useState({
    id: Date.now(),
    date: new Date().toISOString().split('T')[0],
    asset: '',
    amount: '',
    price: '',
    strategy: '',
    reasons: '',
    risks: '',
    expectedReturn: '',
    exitPlan: '',
    marketConditions: '',
    emotionalState: '',
    aiReview: ''
  });
  const [editMode, setEditMode] = useState(false);
  const [selectedJournalId, setSelectedJournalId] = useState(null);
  const [showForm, setShowForm] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // 从本地存储加载日志
  useEffect(() => {
    // 初始化时从后端加载日志
    fetchJournals().then(data => {
      // 字段名映射处理
      const mapped = data.map(j => ({
        ...j,
        marketConditions: j.market_conditions,
        aiReview: j.ai_review,
        expectedReturn: j.expected_return,
        exitPlan: j.exit_plan,
        emotionalState: j.emotional_state || j.emotionalState
      }));
      setJournals(mapped);
    }).catch(() => {
      setNotification({ show: true, message: '日志加载失败', type: 'error' });
    });
  }, []);

  // 保存日志到本地存储
  useEffect(() => {
    localStorage.setItem('investmentJournals', JSON.stringify(journals));
  }, [journals]);

  // 处理表单输入变化
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentJournal(prev => ({ ...prev, [name]: value }));
  };

  // 提交表单
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let saved;
      // 使用本地方法生成初始AI复盘建议
      const aiReview = await getLocalAIReview(currentJournal);
      const journalWithReview = {
        ...currentJournal,
        aiReview: aiReview
      };
      
      if (editMode) {
        // 编辑模式：先删除旧的再新增（简化处理）
        await deleteJournal(selectedJournalId);
      }
      saved = await addJournal(journalWithReview);
      setJournals(prev => editMode ? [saved, ...prev.filter(j => j.id !== selectedJournalId)] : [saved, ...prev]);
      setNotification({ show: true, message: editMode ? '日志已更新' : '新日志已保存', type: 'success' });
      resetForm();
    } catch (err) {
      setNotification({ show: true, message: '保存失败', type: 'error' });
    }
  };
  
  // 手动生成AI复盘建议
  const handleGenerateAIReview = async (journal) => {
    try {
      setNotification({ show: true, message: 'AI复盘生成中...', type: 'success' });
      // 调用API获取AI复盘
      const response = await generateAIReview(journal);
      
      // 更新日志中的AI复盘建议
      const updatedJournal = { ...journal, aiReview: response.aiReview || response };
      
      // 更新日志列表
      setJournals(prev => prev.map(j => j.id === journal.id ? updatedJournal : j));
      
      setNotification({ show: true, message: 'AI复盘已生成', type: 'success' });
    } catch (err) {
      console.error('生成AI复盘失败:', err);
      // 使用本地生成的AI复盘
      const localReview = generateLocalAIReview(journal);
      const updatedJournal = { ...journal, aiReview: localReview };
      setJournals(prev => prev.map(j => j.id === journal.id ? updatedJournal : j));
      setNotification({ show: true, message: '使用本地AI复盘生成', type: 'success' });
    }
  };

  // 重置表单
  const resetForm = () => {
    setCurrentJournal({
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      asset: '',
      amount: '',
      price: '',
      strategy: '',
      reasons: '',
      risks: '',
      expectedReturn: '',
      exitPlan: '',
      marketConditions: '',
      emotionalState: '',
      aiReview: ''
    });
    setEditMode(false);
    setSelectedJournalId(null);
  };

  // 删除日志
  const handleDelete = async (id) => {
    try {
      await deleteJournal(id);
      setJournals(prev => prev.filter(journal => journal.id !== id));
      setNotification({ show: true, message: '日志已删除', type: 'success' });
      if (selectedJournalId === id) {
        resetForm();
      }
    } catch (err) {
      setNotification({ show: true, message: '删除失败', type: 'error' });
    }
  };

  // 编辑日志
  const handleEdit = (journal) => {
    // 字段名映射，保证编辑时表单字段正确
    setCurrentJournal({
      ...journal,
      expectedReturn: journal.expected_return || journal.expectedReturn,
      exitPlan: journal.exit_plan || journal.exitPlan,
      marketConditions: journal.market_conditions || journal.marketConditions,
      emotionalState: journal.emotional_state || journal.emotionalState
    });
    setEditMode(true);
    setSelectedJournalId(journal.id);
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  // 查看日志详情
  const handleView = (journal) => {
    setSelectedJournalId(journal.id);
    setShowForm(false);
  };

  // 关闭通知
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ ...notification, show: false });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // 本地生成AI复盘建议（作为后备方案）
  const generateLocalAIReview = (journal) => {
    // 这里是一个简单的AI复盘逻辑，实际应用中可以接入更复杂的AI服务
    let review = '';
    
    // 评估投资理由
    if (journal.reasons.length < 50) {
      review += "- 投资理由分析较简短，建议更详细地阐述您的投资逻辑和分析过程。\n";
    } else {
      review += "- 您提供了详细的投资理由，这有助于做出更理性的决策。\n";
    }
    
    // 评估风险意识
    if (journal.risks.length < 30) {
      review += "- 风险分析不够充分，建议详细考虑可能的下行风险和对策。\n";
    } else {
      review += "- 您对风险有一定的认识，这是明智投资的基础。\n";
    }
    
    // 评估退出计划
    if (!journal.exitPlan || journal.exitPlan.length < 20) {
      review += "- 缺乏明确的退出计划可能导致情绪化决策，建议设定明确的止盈止损点。\n";
    } else {
      review += "- 您有明确的退出计划，这有助于避免情绪化交易。\n";
    }
    
    // 评估情绪状态
    if (journal.emotionalState.includes("焦虑") || journal.emotionalState.includes("恐惧") || 
        journal.emotionalState.includes("兴奋") || journal.emotionalState.includes("贪婪")) {
      review += "- 您的情绪状态可能影响决策质量，建议在情绪稳定时做出投资决策。\n";
    } else if (journal.emotionalState.includes("平静") || journal.emotionalState.includes("理性")) {
      review += "- 您的情绪状态有利于做出理性决策，继续保持这种状态。\n";
    }
    
    // 总体建议
    review += "\n总体建议：\n";
    if (journal.strategy && journal.risks && journal.exitPlan) {
      review += "您的投资计划包含了策略、风险分析和退出计划，这是一个良好的投资框架。建议持续记录和复盘每次投资，不断优化您的投资流程。";
    } else {
      review += "投资前请确保您有明确的策略、全面的风险分析和清晰的退出计划。定期复盘过去的投资决策，从中学习并改进投资流程。";
    }
    
    return review;
  };
  
  // 获取AI复盘建议
  const getLocalAIReview = async (journal) => {
    try {
      // 直接返回本地生成的复盘建议
      return generateLocalAIReview(journal);
    } catch (err) {
      console.error('生成本地AI复盘失败', err);
      return '无法生成AI复盘建议，请稍后重试。';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 bg-gray-50 min-h-screen">
      {/* 通知组件 */}
      {notification.show && (
        <div className={`fixed top-4 right-4 p-4 rounded-md shadow-md ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        } flex items-center`}>
          {notification.type === 'success' ? 
            <CheckCircle className="w-5 h-5 mr-2" /> : 
            <AlertCircle className="w-5 h-5 mr-2" />
          }
          {notification.message}
        </div>
      )}
      
      <header className="text-center mb-8 p-4 bg-blue-700 text-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold">投资日志系统</h1>
        <p className="mt-2">记录您的投资思考，获取AI复盘建议</p>
      </header>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* 左侧日志表单 */}
        {showForm && (
          <div className="w-full md:w-2/3 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">{editMode ? '编辑投资日志' : '创建新投资日志'}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">日期</label>
                  <input
                    type="date"
                    name="date"
                    value={currentJournal.date}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">资产名称</label>
                  <input
                    type="text"
                    name="asset"
                    value={currentJournal.asset}
                    onChange={handleInputChange}
                    placeholder="例如：股票代码、加密货币名称等"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">数量</label>
                  <input
                    type="text"
                    name="amount"
                    value={currentJournal.amount}
                    onChange={handleInputChange}
                    placeholder="购买/卖出数量"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">价格</label>
                  <input
                    type="text"
                    name="price"
                    value={currentJournal.price}
                    onChange={handleInputChange}
                    placeholder="交易价格"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">投资策略</label>
                <select
                  name="strategy"
                  value={currentJournal.strategy}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                  required
                >
                  <option value="">-- 选择策略 --</option>
                  <option value="价值投资">价值投资</option>
                  <option value="成长投资">成长投资</option>
                  <option value="指数投资">指数投资</option>
                  <option value="日内交易">日内交易</option>
                  <option value="摇摆交易">摇摆交易</option>
                  <option value="趋势跟踪">趋势跟踪</option>
                  <option value="买入持有">买入持有</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">投资理由</label>
                <textarea
                  name="reasons"
                  value={currentJournal.reasons}
                  onChange={handleInputChange}
                  placeholder="详细描述您做出这个投资决策的原因，包括基本面、技术面分析等"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                  rows="4"
                  required
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">风险分析</label>
                <textarea
                  name="risks"
                  value={currentJournal.risks}
                  onChange={handleInputChange}
                  placeholder="识别并评估可能的风险因素"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                  rows="3"
                  required
                ></textarea>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">预期收益</label>
                  <input
                    type="text"
                    name="expectedReturn"
                    value={currentJournal.expectedReturn}
                    onChange={handleInputChange}
                    placeholder="例如：20%、100点等"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">退出计划</label>
                  <input
                    type="text"
                    name="exitPlan"
                    value={currentJournal.exitPlan}
                    onChange={handleInputChange}
                    placeholder="止盈/止损点或其他退出条件"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">市场状况</label>
                <textarea
                  name="marketConditions"
                  value={currentJournal.marketConditions}
                  onChange={handleInputChange}
                  placeholder="描述当前的市场环境"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                  rows="2"
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">情绪状态</label>
                <input
                  type="text"
                  name="emotionalState"
                  value={currentJournal.emotionalState}
                  onChange={handleInputChange}
                  placeholder="描述您当前的情绪状态，如：平静、焦虑、兴奋等"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                  required
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="inline-flex items-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {editMode ? '更新日志' : '保存日志'}
                </button>
                
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                >
                  重置
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* 右侧日志列表或详情 */}
        <div className={`w-full ${showForm ? 'md:w-1/3' : 'md:w-full'} bg-white p-6 rounded-lg shadow-md`}>
          {selectedJournalId && !showForm ? (
            // 日志详情视图
            (() => {
              const journal = journals.find(j => j.id === selectedJournalId);
              return journal ? (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">投资日志详情</h2>
                    <button
                      onClick={() => setShowForm(true)}
                      className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200 transition"
                    >
                      返回列表
                    </button>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-md mb-6">
                    <div className="flex justify-between">
                      <h3 className="font-bold text-lg">{journal.asset}</h3>
                      <span className="text-gray-600">{journal.date}</span>
                    </div>
                    <div className="mt-2">
                      <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-sm">
                        {journal.strategy}
                      </span>
                      <span className="ml-2 text-gray-700">
                        {journal.amount} @ {journal.price}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-700">投资理由</h4>
                      <p className="mt-1 text-gray-600 bg-gray-50 p-3 rounded-md">{journal.reasons}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-700">风险分析</h4>
                      <p className="mt-1 text-gray-600 bg-gray-50 p-3 rounded-md">{journal.risks}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-700">预期收益</h4>
                        <p className="mt-1 text-gray-600 bg-gray-50 p-3 rounded-md">{journal.expectedReturn}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-700">退出计划</h4>
                        <p className="mt-1 text-gray-600 bg-gray-50 p-3 rounded-md">{journal.exitPlan}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-700">市场状况</h4>
                      <p className="mt-1 text-gray-600 bg-gray-50 p-3 rounded-md">{journal.marketConditions || "未记录"}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-700">情绪状态</h4>
                      <p className="mt-1 text-gray-600 bg-gray-50 p-3 rounded-md">{journal.emotionalState}</p>
                    </div>
                    
                    <div className="mt-6 border-t pt-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-gray-700 flex items-center">
                          <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
                          AI复盘建议
                        </h4>
                        <button
                          onClick={() => handleGenerateAIReview(journal)}
                          className="inline-flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200 transition"
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          生成AI复盘
                        </button>
                      </div>
                      <div className="mt-2 text-gray-700 bg-blue-50 p-4 rounded-md whitespace-pre-line">
                        {journal.aiReview || "点击生成AI复盘按钮获取AI分析建议"}
                      </div>
                    </div>
                    
                    <div className="flex gap-4 mt-6">
                      <button
                        onClick={() => handleEdit(journal)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        编辑日志
                      </button>
                      
                      <button
                        onClick={() => {
                          if (window.confirm("确定要删除这条日志吗？此操作不可逆。")) {
                            handleDelete(journal.id);
                            setShowForm(true);
                          }
                        }}
                        className="bg-red-100 text-red-700 px-4 py-2 rounded-md hover:bg-red-200 transition-colors"
                      >
                        删除日志
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">日志不存在或已被删除</div>
              );
            })()
          ) : (
            // 日志列表视图
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">日志列表</h2>
                {!showForm && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition"
                  >
                    新建日志
                  </button>
                )}
              </div>
              
              {journals.length > 0 ? (
                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                  {journals.map(journal => (
                    <div 
                      key={journal.id} 
                      className="border rounded-md p-3 hover:bg-gray-50 transition cursor-pointer"
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">{journal.asset}</h3>
                        <span className="text-sm text-gray-500">{journal.date}</span>
                      </div>
                      
                      <div className="mt-1 flex items-center">
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 text-xs rounded">
                          {journal.strategy}
                        </span>
                        <span className="ml-2 text-sm text-gray-600">
                          {journal.amount} @ {journal.price}
                        </span>
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleView(journal)}
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          查看
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(journal);
                          }}
                          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800"
                        >
                          编辑
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("确定要删除这条日志吗？此操作不可逆。")) {
                              handleDelete(journal.id);
                            }
                          }}
                          className="inline-flex items-center text-sm text-red-600 hover:text-red-800 ml-auto"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  暂无投资日志记录。点击"创建新投资日志"开始记录您的投资思考！
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}