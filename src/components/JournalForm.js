import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { generateAIReview } from '../api';

const JournalForm = ({ journal, onSave, onCancel, showNotification }) => {
  const [formData, setFormData] = useState({
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
  
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [isEdit, setIsEdit] = useState(false);
  
  // 如果传入了日志对象，则设置为编辑模式
  useEffect(() => {
    if (journal) {
      setFormData({
        id: journal.id,
        date: journal.date,
        asset: journal.asset,
        amount: journal.amount,
        price: journal.price,
        strategy: journal.strategy,
        reasons: journal.reasons,
        risks: journal.risks,
        expectedReturn: journal.expected_return || journal.expectedReturn,
        exitPlan: journal.exit_plan || journal.exitPlan,
        marketConditions: journal.market_conditions || journal.marketConditions,
        emotionalState: journal.emotional_state || journal.emotionalState,
        aiReview: journal.ai_review || journal.aiReview
      });
      setIsEdit(true);
    } else {
      resetForm();
      setIsEdit(false);
    }
  }, [journal]);
  
  // 处理表单输入变化
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // 重置表单
  const resetForm = () => {
    setFormData({
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
  };
  
  // 表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // 优化投资日志策略建议
      showNotification('正在优化投资日志策略...', 'info');
      setIsGenerating(true);
      const aiReview = await generateAIReview(formData);
      setIsGenerating(false);
      
      // 更新表单状态以触发重新渲染
      setFormData(prev => ({
        ...prev,
        aiReview,
        ai_review: aiReview
      }));
      
      // 保存日志
      const journalWithReview = {
        ...formData,
        aiReview,
        ai_review: aiReview
      };
      
      await onSave(journalWithReview, isEdit);
      
      // 成功后重置表单
      if (!isEdit) {
        resetForm();
      }
    } catch (err) {
      console.error('保存日志失败:', err);
      showNotification('保存失败', 'error');
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">{isEdit ? '编辑投资日志' : '创建新投资日志'}</h2>
        <button
          onClick={onCancel}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
        >
          返回列表
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">日期</label>
            <input
              type="date"
              name="date"
              value={formData.date}
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
              value={formData.asset}
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
              value={formData.amount}
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
              value={formData.price}
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
            value={formData.strategy}
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
            value={formData.reasons}
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
            value={formData.risks}
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
              value={formData.expectedReturn}
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
              value={formData.exitPlan}
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
            value={formData.marketConditions}
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
            value={formData.emotionalState}
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
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                生成中...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                {isEdit ? '更新日志' : '保存日志'}
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            重置
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors ml-auto"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
};

export default JournalForm;