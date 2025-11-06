import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { initializeSocket, disconnectSocket, getSocket } from '../services/socket';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (token) {
      const socketInstance = initializeSocket(token);
      setSocket(socketInstance);

      socketInstance.on('users:online', (users) => {
        setOnlineUsers(users);
      });

      return () => {
        disconnectSocket();
        setSocket(null);
      };
    }
  }, [token]);

  const value = {
    socket,
    onlineUsers,
    isConnected: socket?.connected || false,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};