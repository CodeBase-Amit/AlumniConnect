import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { communitiesAPI, messagesAPI } from '../services/api';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { PaperAirplaneIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const CommunityDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [community, setCommunity] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    loadCommunity();
  }, [id]);

  useEffect(() => {
    if (community && isMember) {
      loadMessages();
      if (socket) {
        socket.emit('community:join', id);
        socket.on('message:new', (msg) => {
          setMessages(prev => [...prev, msg]);
        });
      }
    }
  }, [community, isMember, socket, id]);

  const loadCommunity = async () => {
    try {
      setLoading(true);
      const res = await communitiesAPI.getCommunityById(id);
      setCommunity(res.data.community);
      setIsMember(res.data.community.members.some(m => m.user._id === user._id));
    } catch (error) {
      toast.error('Failed to load community');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const res = await messagesAPI.getCommunityMessages(id, { limit: 50 });
      setMessages(res.data.messages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleJoinCommunity = async () => {
    try {
      await communitiesAPI.joinCommunity(id, { message: 'Interested in joining' });
      toast.success('Join request sent!');
      loadCommunity();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join community');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      if (socket) {
        socket.emit('message:send', {
          communityId: id,
          content: newMessage,
          type: 'text'
        });
        setNewMessage('');
      }
    } catch (error) {
      toast.error('Failed to send message');
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

  if (!community) {
    return <MainLayout><p className="text-center py-12 text-gray-500">Community not found</p></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Community Header */}
          <div className="card">
            <img
              src={community.coverImage || 'https://via.placeholder.com/800x200'}
              alt={community.name}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{community.name}</h1>
                <p className="text-gray-600 mt-2">{community.description}</p>
              </div>
              {!isMember ? (
                <button
                  onClick={handleJoinCommunity}
                  className="btn-primary"
                >
                  Join Community
                </button>
              ) : (
                <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg">
                  Member
                </span>
              )}
            </div>
          </div>

          {/* Chat Section */}
          {isMember && (
            <div className="card flex flex-col h-96">
              <h2 className="font-bold text-xl mb-4">Chat</h2>
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 bg-gray-50 p-4 rounded">
                {messages.length > 0 ? (
                  messages.map(msg => (
                    <div key={msg._id} className="bg-white p-3 rounded">
                      <div className="flex items-center space-x-2 mb-1">
                        <img
                          src={msg.sender?.avatar}
                          alt={msg.sender?.name}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="font-medium text-sm">{msg.sender?.name}</span>
                      </div>
                      <p className="text-gray-700">{msg.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500">No messages yet</p>
                )}
              </div>

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
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="card">
            <h3 className="font-bold text-lg mb-4">Community Stats</h3>
            <div className="space-y-3">
              <div>
                <p className="text-gray-600 text-sm">Members</p>
                <p className="text-2xl font-bold">{community.stats?.totalMembers || 0}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Messages</p>
                <p className="text-2xl font-bold">{community.stats?.totalMessages || 0}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Events</p>
                <p className="text-2xl font-bold">{community.stats?.totalEvents || 0}</p>
              </div>
            </div>
          </div>

          {/* Members */}
          <div className="card">
            <h3 className="font-bold text-lg mb-4 flex items-center space-x-2">
              <UserGroupIcon className="w-5 h-5" />
              <span>Members</span>
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {community.members?.slice(0, 10).map(m => (
                <div key={m.user._id} className="flex items-center space-x-2">
                  <img
                    src={m.user.avatar}
                    alt={m.user.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{m.user.name}</p>
                    <p className="text-xs text-gray-500">{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CommunityDetail;