import React, { useState, useEffect } from 'react';
import { fetchJournals, addJournal, deleteJournal, generateAIReview } from './api';
import JournalForm from './components/JournalForm';
import JournalList from './components/JournalList';
import JournalDetail from './components/JournalDetail';
import AIReviewPage from './components/AIReviewPage';
import Notification from './components/Notification';
import { Layers, BookOpen, PlusCircle } from 'lucide-react';

const App = () => {
  // 状态管理
  const [journals, setJournals] = useState([]);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [view, setView] = useState('list'); // 'list', 'detail', 'form', 'aiReview'
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [isLoading, setIsLoading] = useState(true);

  // 从后端加载日志
  useEffect(() => {
    loadJournals();
  }, []);

  // 加载日志
  const loadJournals = async () => {
    setIsLoading(true);
    try {
      const data = await fetchJournals();
      setJournals(data);
    } catch (error) {
      showNotification('日志加载失败', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 保存日志到本地存储
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('investmentJournals', JSON.stringify(journals));
    }
  }, [journals, isLoading]);

  // 显示通知
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ ...notification, show: false });
    }, 3000);
  };

  // 添加新日志
  const handleAddJournal = async (journal) => {
    try {
      const savedJournal = await addJournal(journal);
      setJournals(prev => [savedJournal, ...prev]);
      showNotification('新日志已保存', 'success');
      setView('list');
    } catch (error) {
      showNotification('保存失败', 'error');
    }
  };

  // 更新日志
  const handleUpdateJournal = async (journal) => {
    try {
      // 先删除旧的再添加新的
      await deleteJournal(journal.id);
      const updatedJournal = await addJournal(journal);
      setJournals(prev => [
        updatedJournal, 
        ...prev.filter(j => j.id !== journal.id)
      ]);
      showNotification('日志已更新', 'success');
      setView('list');
    } catch (error) {
      showNotification('更新失败', 'error');
    }
  };

  // 删除日志
  const handleDeleteJournal = async (id) => {
    try {
      await deleteJournal(id);
      setJournals(prev => prev.filter(journal => journal.id !== id));
      showNotification('日志已删除', 'success');
      if (selectedJournal && selectedJournal.id === id) {
        setSelectedJournal(null);
        setView('list');
      }
    } catch (error) {
      showNotification('删除失败', 'error');
    }
  };

  // 生成AI复盘
  const handleGenerateAIReview = async (journal) => {
    // 直接跳转到AI复盘页面
    setView('aiReview');
    setSelectedJournal(journal);
  };

  // 查看日志详情
  const handleViewJournal = (journal) => {
    setSelectedJournal(journal);
    setView('detail');
  };

  // 编辑日志
  const handleEditJournal = (journal) => {
    setSelectedJournal(journal);
    setView('form');
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Notification notification={notification} />
      
      <header className="bg-blue-700 text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center">
            <Layers className="mr-2" />
            投资日志系统
          </h1>
          <div className="flex space-x-2">
            <button 
              onClick={() => setView('list')}
              className={`px-3 py-1 rounded-md flex items-center ${
                view === 'list' ? 'bg-blue-900' : 'bg-blue-600 hover:bg-blue-800'
              }`}
            >
              <BookOpen className="w-4 h-4 mr-1" />
              日志列表
            </button>
            <button 
              onClick={() => {
                setSelectedJournal(null);
                setView('form');
              }}
              className={`px-3 py-1 rounded-md flex items-center ${
                view === 'form' && !selectedJournal ? 'bg-blue-900' : 'bg-blue-600 hover:bg-blue-800'
              }`}
            >
              <PlusCircle className="w-4 h-4 mr-1" />
              新建日志
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto p-4">
        <div className="mt-6">
          {view === 'list' && (
            <JournalList 
              journals={journals}
              onView={handleViewJournal}
              onEdit={handleEditJournal}
              onDelete={handleDeleteJournal}
              onGenerateAI={handleGenerateAIReview}
              isLoading={isLoading}
            />
          )}
          
          {view === 'detail' && selectedJournal && (
            <JournalDetail 
              journal={selectedJournal}
              onClose={() => setView('list')}
              onEdit={handleEditJournal}
              onDelete={handleDeleteJournal}
              onGenerateAIReview={handleGenerateAIReview}
            />
          )}
          
          {view === 'form' && (
            <JournalForm 
              journal={selectedJournal}
              onSubmit={selectedJournal ? handleUpdateJournal : handleAddJournal}
              onCancel={() => setView('list')}
              showNotification={showNotification}
            />
          )}
          
          {view === 'aiReview' && selectedJournal && (
            <AIReviewPage 
              journal={selectedJournal}
              onBack={() => setView('list')}
            />
          )}
        </div>
      </main>
      
      <footer className="mt-12 p-4 bg-gray-100 text-center text-gray-600 text-sm">
        <p>投资日志系统 &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default App;