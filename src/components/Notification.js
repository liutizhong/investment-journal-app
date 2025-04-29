import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

const Notification = ({ notification }) => {
  if (!notification || !notification.show) return null;
  
  return (
    <div 
      className={`fixed top-4 right-4 p-4 rounded-md shadow-md z-50 animate-fade-in ${
        notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      } flex items-center`}
    >
      {notification.type === 'success' ? 
        <CheckCircle className="w-5 h-5 mr-2" /> : 
        <AlertCircle className="w-5 h-5 mr-2" />
      }
      {notification.message}
    </div>
  );
};

export default Notification;