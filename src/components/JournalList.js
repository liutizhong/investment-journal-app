import React from 'react';
import { FileText, Edit, Archive, Brain } from 'lucide-react';

const JournalList = ({ journals, onView, onEdit, onArchive, onGenerateAI }) => {
  if (journals.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold mb-4">投资日志列表</h2>
        <div className="text-gray-500">
          暂无投资日志记录。请点击"创建新日志"按钮开始记录您的投资思考！
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Trading Cards</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {journals.map(journal => (
          <div 
            key={journal.id} 
            className={`border rounded-lg p-4 hover:shadow-md transition ${journal.archived ? 'bg-gray-100' : 'bg-white'}`}
          >
            {journal.archived && (
              <div className="text-xs text-gray-500 mb-1 flex items-center">
                <Archive className="w-3 h-3 mr-1" />
                已归档 {journal.exit_date && `(退出日期: ${journal.exit_date})`}
              </div>
            )}
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-lg">{journal.asset}</h3>
              <span className="text-sm text-gray-500">{journal.date}</span>
            </div>
            
            <div className="mt-2 flex items-center">
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 text-xs rounded">
                {journal.strategy}
              </span>
              <span className="ml-2 text-sm text-gray-600">
                {journal.amount} @ {journal.price}
              </span>
            </div>
            
            <div className="mt-3 text-sm text-gray-600 line-clamp-2">
              {journal.reasons}
            </div>
            
            <div className="flex gap-2 mt-4 pt-2 border-t">
              <button
                onClick={() => onView(journal)}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
              >
                <FileText className="w-4 h-4 mr-1" />
                查看
              </button>
              
              <button
                onClick={() => onGenerateAI(journal)}
                className="inline-flex items-center text-sm text-purple-600 hover:text-purple-800 px-2 py-1 rounded hover:bg-purple-50"
              >
                <Brain className="w-4 h-4 mr-1" />
                AI复盘
              </button>
              
              <button
                onClick={() => onEdit(journal)}
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-50"
              >
                <Edit className="w-4 h-4 mr-1" />
                编辑
              </button>
              
              {!journal.archived && (
                <button
                  onClick={() => {
                    if (window.confirm("确定要归档这条日志吗？归档后可在归档列表中查看。")) {
                      onArchive(journal);
                    }
                  }}
                  className="inline-flex items-center text-sm text-amber-600 hover:text-amber-800 px-2 py-1 rounded hover:bg-amber-50 ml-auto"
                >
                  <Archive className="w-4 h-4 mr-1" />
                  归档
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JournalList;