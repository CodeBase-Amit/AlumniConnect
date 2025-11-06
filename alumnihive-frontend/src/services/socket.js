import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const initializeSocket = (token) => {
  if (!token) return null;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinCommunity = (communityId) => {
  if (socket) {
    socket.emit('community:join', communityId);
  }
};

export const leaveCommunity = (communityId) => {
  if (socket) {
    socket.emit('community:leave', communityId);
  }
};

export const sendMessage = (data) => {
  if (socket) {
    socket.emit('message:send', data);
  }
};

export const sendPrivateMessage = (data) => {
  if (socket) {
    socket.emit('message:private', data);
  }
};

export const startTyping = (data) => {
  if (socket) {
    socket.emit('typing:start', data);
  }
};

export const stopTyping = (data) => {
  if (socket) {
    socket.emit('typing:stop', data);
  }
};

export const markMessageRead = (messageId) => {
  if (socket) {
    socket.emit('message:read', { messageId });
  }
};

export default {
  initializeSocket,
  getSocket,
  disconnectSocket,
  joinCommunity,
  leaveCommunity,
  sendMessage,
  sendPrivateMessage,
  startTyping,
  stopTyping,
  markMessageRead,
};