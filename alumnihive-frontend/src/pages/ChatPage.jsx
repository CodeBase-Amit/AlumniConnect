import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { messagesAPI, usersAPI } from '../services/api';
import toast from 'react-hot-toast';
import { PaperAirplaneIcon, TrashIcon, UserIcon } from '@heroicons/react/24/outline';
import Avatar from '../components/Avatar';

const ChatPage = () => {
  const { user: currentUser } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);

  const currentUserId = currentUser?.id || currentUser?._id;

  useEffect(() => { loadUsers(); }, []);
  useEffect(() => { if (selectedUser) loadMessages(); }, [selectedUser, socket]);
  useEffect(() => { setSelectionMode(false); setSelectedMessageIds([]); }, [selectedUser?._id]);

  useEffect(() => {
    if (!socket || !selectedUser) return;
    const selectedUserId = selectedUser._id;

    const handlePrivateMessage = (msg) => {
      const senderId = msg.sender?._id || msg.sender;
      const receiverId = msg.receiver?._id || msg.receiver;
      const relevant = [senderId?.toString(), receiverId?.toString()].includes(selectedUserId.toString());
      if (!relevant) return;
      setMessages((prev) => prev.some(e => e._id === msg._id) ? prev : [...prev, msg]);
    };

    const handleTypingStart = (payload) => {
      if (payload?.userId?.toString() === selectedUserId.toString()) setTypingUser(payload.userName || 'Typing...');
    };
    const handleTypingStop = (payload) => {
      if (payload?.userId?.toString() === selectedUserId.toString()) setTypingUser(null);
    };
    const handlePrivateDeleted = (payload) => {
      const deletedIds = payload?.messageIds || [];
      if (!deletedIds.length) return;
      setMessages((prev) => prev.filter((msg) => !deletedIds.includes(msg._id)));
      setSelectedMessageIds((prev) => prev.filter((id) => !deletedIds.includes(id)));
    };

    socket.on('message:private:new', handlePrivateMessage);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.on('message:private:deleted', handlePrivateDeleted);
    return () => {
      socket.off('message:private:new', handlePrivateMessage);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('message:private:deleted', handlePrivateDeleted);
    };
  }, [socket, selectedUser]);

  useEffect(() => {
    if (!socket || !selectedUser) return;
    messages.filter(msg => {
      const s = msg.sender?._id || msg.sender;
      const r = msg.receiver?._id || msg.receiver;
      return s?.toString() === selectedUser._id.toString() && r?.toString() === currentUserId?.toString() && !msg.read;
    }).forEach(msg => socket.emit('message:read', { messageId: msg._id }));
  }, [messages, socket, selectedUser, currentUserId]);

  const loadUsers = async () => {
    try {
      const res = await usersAPI.getUsers({ limit: 50 });
      setUsers(res.data.users.filter(u => u._id !== currentUserId));
      setLoading(false);
    } catch (error) { toast.error('Failed to load users'); setLoading(false); }
  };

  const loadMessages = async () => {
    try {
      const res = await messagesAPI.getPrivateMessages(selectedUser._id, { limit: 50 });
      setMessages(res.data.messages);
    } catch (error) { console.error('Failed to load messages:', error); }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;
    if (socket) {
      socket.emit('message:private', { receiverId: selectedUser._id, content: newMessage, type: 'text' });
      setNewMessage('');
      socket.emit('typing:stop', { receiverId: selectedUser._id });
    }
  };

  const handleInputChange = (value) => {
    setNewMessage(value);
    if (!socket || !selectedUser) return;
    if (value.trim()) socket.emit('typing:start', { receiverId: selectedUser._id });
    else socket.emit('typing:stop', { receiverId: selectedUser._id });
  };

  const toggleSelectionMode = () => setSelectionMode((prev) => { if (prev) setSelectedMessageIds([]); return !prev; });
  const toggleSelectMessage = (messageId) => setSelectedMessageIds((prev) => prev.includes(messageId) ? prev.filter(id => id !== messageId) : [...prev, messageId]);

  const handleDeleteSingle = async (messageId) => {
    try {
      await messagesAPI.deletePrivateMessage(messageId);
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      setSelectedMessageIds((prev) => prev.filter((id) => id !== messageId));
      toast.success('Chat deleted');
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to delete chat'); }
  };

  const handleDeleteSelected = async () => {
    if (!selectedMessageIds.length) return;
    try {
      await messagesAPI.bulkDeletePrivateMessages(selectedMessageIds);
      setMessages((prev) => prev.filter((msg) => !selectedMessageIds.includes(msg._id)));
      setSelectedMessageIds([]);
      setSelectionMode(false);
      toast.success('Selected chats deleted');
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to delete'); }
  };

  if (loading) return (
    <MainLayout>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-10rem)]">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-pulse">
          <div className="h-5 w-24 bg-gray-200 rounded mb-4"></div>
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-3 w-24 bg-gray-200 rounded mb-1.5"></div>
                <div className="h-2.5 w-14 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-pulse flex flex-col">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div>
              <div className="h-4 w-28 bg-gray-200 rounded mb-1.5"></div>
              <div className="h-3 w-16 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <div className="h-10 w-48 bg-gray-200 rounded-xl ml-auto"></div>
            <div className="h-10 w-40 bg-gray-200 rounded-xl"></div>
            <div className="h-10 w-52 bg-gray-200 rounded-xl ml-auto"></div>
          </div>
          <div className="h-12 bg-gray-200 rounded-xl mt-4"></div>
        </div>
      </div>
    </MainLayout>
  );

  if (!currentUserId) return <MainLayout><div className="text-center py-16 text-gray-400 text-sm">Preparing chat session...</div></MainLayout>;

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-10rem)]">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Messages</h2>
          <div className="space-y-0.5">
            {users.map(u => {
              const isOnline = onlineUsers.some(ou => ou.userId.toString() === u._id.toString());
              const isSelected = selectedUser?._id === u._id;
              return (
                <button key={u._id} onClick={() => setSelectedUser(u)}
                  className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 cursor-pointer ${isSelected ? 'bg-primary-50 ring-1 ring-primary-100' : 'hover:bg-gray-50'}`}>
                  <div className="relative shrink-0">
                    <Avatar name={u.name} className="w-9 h-9 text-xs" />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-medium text-sm text-gray-900 truncate">{u.name}</p>
                    <p className={`text-xs ${isOnline ? 'text-green-600' : 'text-gray-400'}`}>{isOnline ? 'Online' : 'Offline'}</p>
                  </div>
                </button>
              );
            })}
            {users.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">No users available</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
          {selectedUser ? (
            <>
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
                <div className="relative shrink-0">
                  <Avatar name={selectedUser.name} className="w-10 h-10" />
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${onlineUsers.some(ou => ou.userId.toString() === selectedUser._id.toString()) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{selectedUser.name}</p>
                  <p className="text-xs text-gray-400">
                    {onlineUsers.some(ou => ou.userId.toString() === selectedUser._id.toString()) ? 'Online' : 'Offline'}
                    {typingUser && <span className="text-primary-600 ml-2 animate-pulse">{typingUser} typing...</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selectionMode && (
                    <button onClick={handleDeleteSelected} disabled={selectedMessageIds.length === 0}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed">
                      <TrashIcon className="w-3.5 h-3.5" /> Delete ({selectedMessageIds.length})
                    </button>
                  )}
                  <button onClick={toggleSelectionMode}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${selectionMode ? 'text-gray-600 bg-gray-100 hover:bg-gray-200' : 'text-primary-600 bg-primary-50 hover:bg-primary-100'}`}>
                    {selectionMode ? 'Cancel' : 'Select'}
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50/80">
                {messages.length > 0 ? messages.map(msg => {
                  const isCurrentUser = (msg.sender?._id || msg.sender)?.toString() === currentUserId?.toString();
                  const isSelected = selectedMessageIds.includes(msg._id);
                  return (
                    <div key={msg._id} className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                      {selectionMode && (
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelectMessage(msg._id)}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer mb-2" />
                      )}
                      <div className={`max-w-[70%] ${isCurrentUser ? 'order-1' : 'order-1'}`}>
                        <div onClick={() => { if (selectionMode) toggleSelectMessage(msg._id); }}
                          className={`px-4 py-2.5 text-sm leading-relaxed ${isCurrentUser ? 'bg-indigo-600 text-white rounded-2xl rounded-br-md' : 'bg-white text-gray-900 border border-gray-100 rounded-2xl rounded-bl-md shadow-sm'} ${selectionMode ? 'cursor-pointer' : ''}`}>
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>
                        <p className={`text-[10px] text-gray-400 mt-1 ${isCurrentUser ? 'text-right mr-1' : 'text-left ml-1'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {!selectionMode && (
                        <button onClick={() => handleDeleteSingle(msg._id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition opacity-0 hover:opacity-100 group-hover:opacity-100 cursor-pointer mb-2">
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                }) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400 text-sm">No messages yet. Say hello!</p>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="flex items-center gap-3 px-5 py-4 border-t border-gray-100 shrink-0">
                <input type="text" value={newMessage} onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition" />
                <button type="submit" disabled={!newMessage.trim()}
                  className="p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-400 text-sm font-medium">Select a user to start chatting</p>
                <p className="text-gray-300 text-xs mt-1">Choose from the sidebar to begin a conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ChatPage;
