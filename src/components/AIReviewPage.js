import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const AIReviewPage = ({ journal, onBack, onGenerateAIReview }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [processedJournal, setProcessedJournal] = useState(null);
  
  useEffect(() => {
    if (journal) {
      // 确保sell_records始终是数组
      let sell_records = [];
      if (journal.sell_records) {
        // 如果是字符串（JSON），解析它
        if (typeof journal.sell_records === 'string') {
          try {
            sell_records = JSON.parse(journal.sell_records);
          } catch (e) {
            console.error('Error parsing sell_records:', e);
            sell_records = [];
          }
        } else if (Array.isArray(journal.sell_records)) {
          // 如果已经是数组，直接使用
          sell_records = journal.sell_records;
        }
      }
      
      setProcessedJournal({
        ...journal,
        sell_records: sell_records
      });
    }
  }, [journal]);
  
  if (!journal || !processedJournal) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">AI复盘总结</h2>
        <button
          onClick={onBack}
          className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200 transition"
        >
          返回列表
        </button>
      </div>

      <div className="bg-blue-50 p-4 rounded-md mb-6">
        <div className="flex justify-between">
          <h3 className="font-bold text-lg">{processedJournal.asset}</h3>
          <span className="text-gray-600">{processedJournal.date}</span>
        </div>
        <div className="mt-2">
          <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-sm">
            {processedJournal.strategy}
          </span>
          <span className="ml-2 text-gray-700">
            {processedJournal.amount} @ {processedJournal.price}
          </span>
        </div>
        
        {processedJournal.archived && (
          <div className="mt-2 text-sm text-gray-600">
            <div className="flex items-center">
              已归档 {processedJournal.exit_date && `(退出日期: ${processedJournal.exit_date})`}
            </div>
          </div>
        )}
        
        {processedJournal.sell_records && processedJournal.sell_records.length > 0 && (
          <div className="mt-3 border-t pt-2">
            <h5 className="text-sm font-medium mb-1">卖出记录:</h5>
            {processedJournal.sell_records.map((record, index) => (
              <div key={index} className="text-sm bg-amber-50 p-2 rounded-md mb-1">
                <div className="flex justify-between">
                  <span>卖出日期: {record.date}</span>
                  <span>卖出价格: {record.price}</span>
                </div>
                <div className="flex justify-between">
                  <span>卖出数量: {record.amount}</span>
                </div>
                <div className="mt-1">
                  <span className="font-medium">卖出理由:</span> {record.reason}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
            <h4 className="font-medium text-gray-700">AI建议</h4>
          </div>
          <button
              onClick={async () => {
                try {
                  setIsGenerating(true);
                  setError(null);
                  await onGenerateAIReview(processedJournal);
                } catch (err) {
                  setError('优化投资日志策略失败，请重试');
                  console.error(err);
                } finally {
                  setIsGenerating(false);
                }
              }}
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
                  {processedJournal.aiReview || processedJournal.ai_review ? '重新优化投资日志策略' : '优化投资日志策略'}
                </>
              )}
            </button>
        </div>
        {error && (
          <div className="mt-2 text-red-600 bg-red-50 p-2 rounded-md text-sm">
            {error}
          </div>
        )}
        <div className="text-gray-700 bg-blue-50 p-4 rounded-md prose max-w-none">
          <ReactMarkdown>
            {String(processedJournal.ai_review || processedJournal.aiReview || "暂无AI复盘内容")}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default AIReviewPage;