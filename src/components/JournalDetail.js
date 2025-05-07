import React from 'react';
import { RefreshCw, AlertCircle, Archive } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const JournalDetail = ({ journal, onClose, onEdit, onArchive, onGenerateAIReview }) => {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState(null);
  
  if (!journal) return null;
  
  const handleGenerateReview = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      await onGenerateAIReview(journal);
    } catch (err) {
      setError('优化投资日志策略失败，请重试');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">投资日志详情</h2>
        <button
          onClick={onClose}
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
            <p className="mt-1 text-gray-600 bg-gray-50 p-3 rounded-md">
              {journal.expected_return || journal.expected_return}
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700">退出计划</h4>
            <p className="mt-1 text-gray-600 bg-gray-50 p-3 rounded-md">
              {journal.exit_plan || journal.exit_plan}
            </p>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-700">市场状况</h4>
          <p className="mt-1 text-gray-600 bg-gray-50 p-3 rounded-md">
            {journal.market_conditions || journal.market_conditions || "未记录"}
          </p>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-700">情绪状态</h4>
          <p className="mt-1 text-gray-600 bg-gray-50 p-3 rounded-md">
            {journal.emotional_state || journal.emotional_state}
          </p>
        </div>
        
        <div className="mt-6 border-t pt-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-700 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
              AI建议
            </h4>
            <button
              onClick={handleGenerateReview}
              disabled={isGenerating}
              className="inline-flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200 transition disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  优化投资日志策略
                </>
              )}
            </button>
          </div>
          {error && (
            <div className="mt-2 text-red-600 bg-red-50 p-2 rounded-md text-sm">
              {error}
            </div>
          )}
          <div className="mt-2 text-gray-700 bg-blue-50 p-4 rounded-md prose max-w-none">
            <ReactMarkdown>
              {String(journal.ai_review || journal.ai_review || "点击优化投资日志策略按钮获取AI分析建议")}
            </ReactMarkdown>
          </div>
        </div>
        
        <div className="flex gap-4 mt-6">
          <button
            onClick={() => onEdit(journal)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            编辑日志
          </button>
          
          {!journal.archived && (
            <button
              onClick={() => {
                if (window.confirm("确定要归档这条日志吗？归档后可在归档列表中查看。")) {
                  onArchive(journal);
                }
              }}
              className="bg-amber-100 text-amber-700 px-4 py-2 rounded-md hover:bg-amber-200 transition-colors flex items-center"
            >
              <Archive className="w-4 h-4 mr-2" />
              归档日志
            </button>
          )}
          {journal.archived && (
            <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-md flex items-center">
              <Archive className="w-4 h-4 mr-2" />
              已归档 {journal.exit_date && `(退出日期: ${journal.exit_date})`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JournalDetail;