import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, Send } from 'lucide-react'; // Added Send icon
import ReactMarkdown from 'react-markdown';
import { generateAIReview, addAIReviewLogManual } from '../api'; // Import new API functions

const AIReviewPage = ({ journal, onBack, onJournalUpdate }) => { // Changed onGenerateAIReview to onJournalUpdate
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmittingManualLog, setIsSubmittingManualLog] = useState(false);
  const [manualLogText, setManualLogText] = useState('');
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
        sell_records: sell_records,
        ai_review_logs: journal.ai_review_logs || [] // Ensure ai_review_logs is an array
      });
      setError(null); // Clear previous errors when journal changes
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
                  const reviewInput = {
                    date: processedJournal.date,
                    asset: processedJournal.asset,
                    amount: processedJournal.amount,
                    price: processedJournal.price,
                    strategy: processedJournal.strategy,
                    reasons: processedJournal.reasons,
                    risks: processedJournal.risks,
                    expected_return: processedJournal.expected_return,
                    exit_plan: processedJournal.exit_plan,
                    market_conditions: processedJournal.market_conditions,
                    emotional_state: processedJournal.emotional_state,
                  };
                  const newLog = await generateAIReview(processedJournal.id, reviewInput);
                  setProcessedJournal(prev => ({
                    ...prev,
                    ai_review_logs: [...(prev.ai_review_logs || []), newLog].sort((a,b) => new Date(a.created_at) - new Date(b.created_at))
                  }));
                  if(onJournalUpdate) onJournalUpdate(); // Notify parent to refetch or update
                } catch (err) {
                  setError(err.message || '优化投资日志策略失败，请重试');
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
                  生成AI建议
                </>
              )}
            </button>
        </div>
        {error && (
          <div className="mt-2 text-red-600 bg-red-50 p-2 rounded-md text-sm">
            {error}
          </div>
        )}
        {processedJournal.ai_review_logs && processedJournal.ai_review_logs.length > 0 ? (
          processedJournal.ai_review_logs.map((log, index) => (
            <div key={log.id || index} className="mb-4 text-gray-700 bg-blue-50 p-4 rounded-md prose max-w-none">
              <ReactMarkdown>{log.review_content}</ReactMarkdown>
              <p className="text-xs text-gray-500 mt-2">记录时间: {new Date(log.created_at).toLocaleString()}</p>
            </div>
          ))
        ) : (
          <div className="text-gray-700 bg-blue-50 p-4 rounded-md prose max-w-none">
            <ReactMarkdown>{"暂无AI复盘内容"}</ReactMarkdown>
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t">
        <h4 className="font-medium text-gray-700 mb-3">手动添加复盘日志</h4>
        <textarea
          value={manualLogText}
          onChange={(e) => setManualLogText(e.target.value)}
          placeholder="在此输入您的复盘思考..."
          rows={4}
          className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={async () => {
            if (!manualLogText.trim()) {
              setError('复盘内容不能为空');
              return;
            }
            try {
              setIsSubmittingManualLog(true);
              setError(null);
              const newLog = await addAIReviewLogManual(processedJournal.id, manualLogText);
              setProcessedJournal(prev => ({
                ...prev,
                ai_review_logs: [...(prev.ai_review_logs || []), newLog].sort((a,b) => new Date(a.created_at) - new Date(b.created_at))
              }));
              setManualLogText(''); // Clear textarea
              if(onJournalUpdate) onJournalUpdate(); // Notify parent to refetch or update
            } catch (err) {
              setError(err.message || '添加复盘日志失败，请重试');
              console.error(err);
            } finally {
              setIsSubmittingManualLog(false);
            }
          }}
          disabled={isSubmittingManualLog}
          className="mt-3 inline-flex items-center bg-green-100 text-green-700 px-4 py-2 rounded-md hover:bg-green-200 transition disabled:opacity-50"
        >
          {isSubmittingManualLog ? (
            <>
              <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              提交中...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-1" />
              提交日志
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AIReviewPage;