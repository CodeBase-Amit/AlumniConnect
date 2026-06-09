import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { initializeSocket, disconnectSocket, getSocket } from '../services/socket';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

const showNotificationToast = (notification) => {
  toast(
    (t) => (
      <div className="flex items-start gap-3 min-w-0">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">{notification.title}</p>
          <p className="text-xs text-gray-600 truncate">{notification.message}</p>
        </div>
      </div>
    ),
    {
      duration: 5000,
      position: 'top-right',
      style: {
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        padding: '12px 16px',
        border: '1px solid #e5e7eb',
        cursor: 'pointer',
      },
    }
  );
};

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (token) {
      const socketInstance = initializeSocket(token);
      setSocket(socketInstance);

      socketInstance.on('users:online', (users) => {
        setOnlineUsers(users);
      });

      socketInstance.on('notification:new', (notification) => {
        setUnreadCount((prev) => prev + 1);
        showNotificationToast(notification);
      });

      return () => {
        disconnectSocket();
        setSocket(null);
      };
    }
  }, [token]);

  const clearUnreadCount = useCallback(() => setUnreadCount(0), []);

  const value = {
    socket,
    onlineUsers,
    isConnected: socket?.connected || false,
    unreadCount,
    clearUnreadCount,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};