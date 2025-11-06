import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { messagesAPI, usersAPI } from '../services/api';
import toast from 'react-hot-toast';
import { PaperAirplaneIcon, UserIcon } from '@heroicons/react/24/outline';

const ChatPage = () => {
  const { user: currentUser } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadMessages();
      if (socket) {
        socket.on('message:private:new', (msg) => {
          if (msg.sender._id === selectedUser._id || msg.receiver === selectedUser._id) {
            setMessages(prev => [...prev, msg]);
          }
        });
      }
    }
  }, [selectedUser, socket]);

  const loadUsers = async () => {
    try {
      const res = await usersAPI.getUsers({ limit: 50 });
      setUsers(res.data.users.filter(u => u._id !== currentUser._id));
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load users');
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const res = await messagesAPI.getPrivateMessages(selectedUser._id, { limit: 50 });
      setMessages(res.data.messages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    if (socket) {
      socket.emit('message:private', {
        receiverId: selectedUser._id,
        content: newMessage,
        type: 'text'
      });
      setNewMessage('');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-96">
        {/* Users List */}
        <div className="card overflow-y-auto">
          <h2 className="font-bold text-lg mb-4">Messages</h2>
          <div className="space-y-2">
            {users.map(u => {
              const isOnline = onlineUsers.some(ou => ou.userId.toString() === u._id.toString());
              const isSelected = selectedUser?._id === u._id;

              return (
                <button
                  key={u._id}
                  onClick={() => setSelectedUser(u)}
                  className={`w-full p-3 rounded-lg text-left transition ${
                    isSelected ? 'bg-primary-100' : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-8 h-8 rounded-full"
                      />
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{u.name}</p>
                      <p className="text-xs text-gray-500">{isOnline ? 'Online' : 'Offline'}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Area */}
        <div className="md:col-span-2 card flex flex-col">
          {selectedUser ? (
            <>
              {/* Header */}
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-200 mb-4">
                <img
                  src={selectedUser.avatar}
                  alt={selectedUser.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium">{selectedUser.name}</p>
                  <p className="text-xs text-gray-500">
                    {onlineUsers.some(ou => ou.userId.toString() === selectedUser._id.toString())
                      ? 'Online'
                      : 'Offline'}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 bg-gray-50 p-4 rounded">
                {messages.length > 0 ? (
                  messages.map(msg => (
                    <div
                      key={msg._id}
                      className={`flex ${
                        msg.sender._id === currentUser._id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.sender._id === currentUser._id
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p>{msg.content}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500">No messages yet</p>
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="input-field flex-1"
                />
                <button type="submit" className="btn-primary">
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <UserIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Select a user to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ChatPage;