import React, { useState } from 'react';
import { Archive, X } from 'lucide-react';

const ArchiveForm = ({ journal, onArchive, onCancel }) => {
//   const [formData, setFormData] = useState({
//     sellReason: '',
//     sellPrice: '',
//     sellAmount: journal.amount || ''
//   });

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

  const handleSubmit = (e) => {
    e.preventDefault();
    onArchive(journal);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Archive className="w-5 h-5 mr-2 text-amber-600" />
            归档投资日志
          </h2>
          <button 
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="bg-amber-50 p-3 rounded-md mb-4">
          <div className="flex justify-between">
            <span className="font-medium">{journal.asset}</span>
            <span className="text-gray-600">{journal.date}</span>
          </div>
          <div className="mt-1 text-sm">
            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
              {journal.strategy}
            </span>
            <span className="ml-2">
              {journal.amount} @ {journal.price}
            </span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              卖出理由
            </label>
            <textarea
              name="sellReason"
              value={formData.sellReason}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500"
              rows="3"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                卖出价格
              </label>
              <input
                type="text"
                name="sellPrice"
                value={formData.sellPrice}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                卖出数量
              </label>
              <input
                type="text"
                name="sellAmount"
                value={formData.sellAmount}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div> */}
          
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gray-200 text-gray rounded-md hover:bg-gray-300 transition flex items-center"
            >
              <Archive className="w-4 h-4 mr-2" />
              确认归档
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArchiveForm;