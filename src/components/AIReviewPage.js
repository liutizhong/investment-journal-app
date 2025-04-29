import React from 'react';
import { AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const AIReviewPage = ({ journal, onBack }) => {
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
        <div className="flex items-center mb-4">
          <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
          <h4 className="font-medium text-gray-700">AI复盘建议</h4>
        </div>
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