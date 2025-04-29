import React, { useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const AIReviewPage = ({ journal, onBack, onGenerateAIReview }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  
  if (!journal) return null;

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
          <h3 className="font-bold text-lg">{journal.asset}</h3>
          <span className="text-gray-600">{journal.date}</span>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
            <h4 className="font-medium text-gray-700">AI复盘建议</h4>
          </div>
          <button
              onClick={async () => {
                try {
                  setIsGenerating(true);
                  setError(null);
                  await onGenerateAIReview(journal);
                } catch (err) {
                  setError('生成AI复盘失败，请重试');
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
                  {journal.aiReview || journal.ai_review ? '重新生成AI复盘' : '生成AI复盘'}
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
            {journal.aiReview || journal.ai_review || "暂无AI复盘内容"}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default AIReviewPage;