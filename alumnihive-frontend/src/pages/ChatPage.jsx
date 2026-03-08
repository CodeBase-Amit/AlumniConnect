import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { messagesAPI, usersAPI } from '../services/api';
import toast from 'react-hot-toast';
import { CheckIcon, PaperAirplaneIcon, TrashIcon, UserIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { resolveMediaUrl } from '../utils/constants';

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

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadMessages();
    }
  }, [selectedUser, socket]);

  useEffect(() => {
    setSelectionMode(false);
    setSelectedMessageIds([]);
  }, [selectedUser?._id]);

  useEffect(() => {
    if (!socket || !selectedUser) {
      return undefined;
    }

    const selectedUserId = selectedUser._id;

    const handlePrivateMessage = (msg) => {
      const senderId = msg.sender?._id || msg.sender;
      const receiverId = msg.receiver?._id || msg.receiver;
      const relevant = [senderId?.toString(), receiverId?.toString()].includes(selectedUserId.toString());

      if (!relevant) {
        return;
      }

      setMessages((prev) => {
        if (prev.some(existing => existing._id === msg._id)) {
          return prev;
        }
        return [...prev, msg];
      });
    };

    const handleTypingStart = (payload) => {
      if (payload?.userId?.toString() === selectedUserId.toString()) {
        setTypingUser(payload.userName || 'Typing...');
      }
    };

    const handleTypingStop = (payload) => {
      if (payload?.userId?.toString() === selectedUserId.toString()) {
        setTypingUser(null);
      }
    };

    const handlePrivateDeleted = (payload) => {
      const deletedIds = payload?.messageIds || [];
      if (!deletedIds.length) {
        return;
      }

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
    if (!socket || !selectedUser) {
      return;
    }

    messages
      .filter(msg => {
        const senderId = msg.sender?._id || msg.sender;
        const receiverId = msg.receiver?._id || msg.receiver;
        return senderId?.toString() === selectedUser._id.toString() && receiverId?.toString() === currentUserId?.toString() && !msg.read;
      })
      .forEach(msg => {
        socket.emit('message:read', { messageId: msg._id });
      });
  }, [messages, socket, selectedUser, currentUserId]);

  const loadUsers = async () => {
    try {
      const res = await usersAPI.getUsers({ limit: 50 });
      setUsers(res.data.users.filter(u => u._id !== currentUserId));
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
      socket.emit('typing:stop', { receiverId: selectedUser._id });
    }
  };

  const handleInputChange = (value) => {
    setNewMessage(value);
    if (!socket || !selectedUser) {
      return;
    }

    if (value.trim()) {
      socket.emit('typing:start', { receiverId: selectedUser._id });
    } else {
      socket.emit('typing:stop', { receiverId: selectedUser._id });
    }
  };

  const toggleSelectionMode = () => {
    setSelectionMode((prev) => {
      if (prev) {
        setSelectedMessageIds([]);
      }
      return !prev;
    });
  };

  const toggleSelectMessage = (messageId) => {
    setSelectedMessageIds((prev) => {
      if (prev.includes(messageId)) {
        return prev.filter((id) => id !== messageId);
      }
      return [...prev, messageId];
    });
  };

  const handleDeleteSingle = async (messageId) => {
    try {
      await messagesAPI.deletePrivateMessage(messageId);
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      setSelectedMessageIds((prev) => prev.filter((id) => id !== messageId));
      toast.success('Chat deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete chat');
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedMessageIds.length) {
      return;
    }

    try {
      await messagesAPI.bulkDeletePrivateMessages(selectedMessageIds);
      setMessages((prev) => prev.filter((msg) => !selectedMessageIds.includes(msg._id)));
      setSelectedMessageIds([]);
      setSelectionMode(false);
      toast.success('Selected chats deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete selected chats');
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

  if (!currentUserId) {
    return (
      <MainLayout>
        <div className="text-center py-12 text-gray-500">Preparing chat session...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[620px]">
        {/* Users List */}
        <div className="card overflow-y-auto border border-gray-200">
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
                        src={resolveMediaUrl(u.avatar)}
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
        <div className="md:col-span-2 card flex flex-col border border-gray-200">
          {selectedUser ? (
            <>
              {/* Header */}
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-200 mb-4">
                <img
                  src={resolveMediaUrl(selectedUser.avatar)}
                  alt={selectedUser.name}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <p className="font-medium">{selectedUser.name}</p>
                  <p className="text-xs text-gray-500">
                    {onlineUsers.some(ou => ou.userId.toString() === selectedUser._id.toString())
                      ? 'Online'
                      : 'Offline'}
                  </p>
                  {typingUser && (
                    <p className="text-xs text-primary-600">{typingUser} is typing...</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {selectionMode && (
                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      disabled={selectedMessageIds.length === 0}
                      className="inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Delete Selected ({selectedMessageIds.length})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={toggleSelectionMode}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                  >
                    {selectionMode ? (
                      <>
                        <XMarkIcon className="h-4 w-4" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4" />
                        Select
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                {messages.length > 0 ? (
                  messages.map(msg => {
                    const isCurrentUser = (msg.sender?._id || msg.sender)?.toString() === currentUserId?.toString();
                    const isSelected = selectedMessageIds.includes(msg._id);

                    return (
                      <div
                        key={msg._id}
                        className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        {selectionMode && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectMessage(msg._id)}
                            className="h-4 w-4 cursor-pointer"
                          />
                        )}
                        <div
                          onClick={() => {
                            if (selectionMode) {
                              toggleSelectMessage(msg._id);
                            }
                          }}
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            isCurrentUser
                              ? 'bg-primary-600 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          } ${selectionMode ? 'cursor-pointer' : ''}`}
                        >
                          <p>{msg.content}</p>
                          <p className="text-[10px] opacity-70 mt-1 text-right">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSingle(msg._id)}
                          className="rounded-full p-1 text-gray-500 hover:bg-red-100 hover:text-red-700"
                          title="Delete chat"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-gray-500">No messages yet</p>
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => handleInputChange(e.target.value)}
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