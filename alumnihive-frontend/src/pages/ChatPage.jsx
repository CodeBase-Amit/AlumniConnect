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

  if (loading) return <MainLayout><div className="text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-[3px] border-primary-600 border-t-transparent mx-auto"></div></div></MainLayout>;
  if (!currentUserId) return <MainLayout><div className="text-center py-12 text-gray-400 text-sm">Preparing chat session...</div></MainLayout>;

  return (
    <MainLayout>
      <div className="grid md:grid-cols-3 gap-5 min-h-[600px]">
        <div className="card overflow-y-auto border border-gray-200">
          <h2 className="font-bold text-gray-900 mb-3">Messages</h2>
          <div className="space-y-1">
            {users.map(u => {
              const isOnline = onlineUsers.some(ou => ou.userId.toString() === u._id.toString());
              const isSelected = selectedUser?._id === u._id;
              return (
                <button key={u._id} onClick={() => setSelectedUser(u)}
                  className={`w-full p-2.5 rounded-lg text-left transition flex items-center gap-2.5 cursor-pointer ${isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'}`}>
                  <div className="relative shrink-0">
                    <Avatar name={u.name} className="w-8 h-8 text-xs" />
                    {isOnline && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-accent-500 rounded-full border-2 border-white"></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{u.name}</p>
                    <p className="text-xs text-gray-400">{isOnline ? 'Online' : 'Offline'}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-2 card flex flex-col border border-gray-200">
          {selectedUser ? (
            <>
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100 mb-4">
                <Avatar name={selectedUser.name} className="w-9 h-9" />
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">{selectedUser.name}</p>
                  <p className="text-xs text-gray-400">
                    {onlineUsers.some(ou => ou.userId.toString() === selectedUser._id.toString()) ? 'Online' : 'Offline'}
                    {typingUser && <span className="text-primary-600 ml-2">{typingUser} typing...</span>}
                  </p>
                </div>
                {selectionMode && (
                  <button onClick={handleDeleteSelected} disabled={selectedMessageIds.length === 0}
                    className="btn-danger text-xs px-2.5 py-1 disabled:opacity-50">Delete ({selectedMessageIds.length})</button>
                )}
                <button onClick={toggleSelectionMode} className="btn-ghost text-xs px-2.5 py-1">{selectionMode ? 'Cancel' : 'Select'}</button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                {messages.length > 0 ? messages.map(msg => {
                  const isCurrentUser = (msg.sender?._id || msg.sender)?.toString() === currentUserId?.toString();
                  const isSelected = selectedMessageIds.includes(msg._id);
                  return (
                    <div key={msg._id} className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                      {selectionMode && <input type="checkbox" checked={isSelected} onChange={() => toggleSelectMessage(msg._id)} className="h-4 w-4 cursor-pointer" />}
                      <div onClick={() => { if (selectionMode) toggleSelectMessage(msg._id); }}
                        className={`max-w-xs px-3.5 py-2 rounded-xl text-sm ${isCurrentUser ? 'bg-primary-600 text-white' : 'bg-white text-gray-900 border border-gray-100'} ${selectionMode ? 'cursor-pointer' : ''}`}>
                        <p>{msg.content}</p>
                        <p className="text-[10px] opacity-60 mt-1 text-right">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      {!selectionMode && <button onClick={() => handleDeleteSingle(msg._id)} className="p-1 text-gray-400 hover:text-red-500 rounded cursor-pointer"><TrashIcon className="w-3.5 h-3.5" /></button>}
                    </div>
                  );
                }) : <p className="text-center text-gray-400 text-sm">No messages yet</p>}
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input type="text" value={newMessage} onChange={(e) => handleInputChange(e.target.value)} placeholder="Type a message..." className="input-field" />
                <button type="submit" className="btn-primary"><PaperAirplaneIcon className="w-5 h-5" /></button>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center"><UserIcon className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">Select a user to start chatting</p></div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ChatPage;
