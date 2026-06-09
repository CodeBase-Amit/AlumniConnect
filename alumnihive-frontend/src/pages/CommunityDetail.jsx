import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { communitiesAPI, messagesAPI } from '../services/api';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { PaperAirplaneIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import Avatar from '../components/Avatar';
import CoverImage from '../components/CoverImage';

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
        const onMessage = (msg) => {
          if (msg.community?.toString() !== id.toString()) return;
          setMessages(prev => [...prev, msg]);
        };
        socket.emit('community:join', id);
        socket.on('message:new', onMessage);
        return () => {
          socket.emit('community:leave', id);
          socket.off('message:new', onMessage);
        };
      }
    }
  }, [community, isMember, socket, id]);

  const loadCommunity = async () => {
    try {
      setLoading(true);
      const res = await communitiesAPI.getCommunityById(id);
      setCommunity(res.data.community);
      setIsMember(res.data.community.members.some(m => m.user?._id === user._id));
    } catch (error) {
      toast.error('Failed to load community');
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
        socket.emit('message:send', { communityId: id, content: newMessage, type: 'text' });
        setNewMessage('');
      }
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  if (loading) {
    return <MainLayout><div className="text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-[3px] border-primary-600 border-t-transparent mx-auto"></div></div></MainLayout>;
  }
  if (!community) return <MainLayout><p className="text-center py-12 text-gray-400 text-sm">Community not found</p></MainLayout>;

  return (
    <MainLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="card">
            <CoverImage type="community" className="w-full h-40 rounded-lg mb-4" title={community.name} />
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{community.name}</h1>
                <p className="text-gray-500 text-sm mt-1">{community.description}</p>
              </div>
              {!isMember ? (
                <button onClick={handleJoinCommunity} className="btn-primary shrink-0">Join Community</button>
              ) : (
                <span className="badge-accent text-sm px-3 py-1">Member</span>
              )}
            </div>
          </div>

          {isMember && (
            <div className="card flex flex-col h-96">
              <h2 className="font-bold text-gray-900 mb-4">Chat</h2>
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                {messages.length > 0 ? (
                  messages.map(msg => (
                    <div key={msg._id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar name={msg.sender?.name} className="w-5 h-5 text-[10px]" />
                        <span className="font-medium text-xs text-gray-900">{msg.sender?.name}</span>
                      </div>
                      <p className="text-gray-600 text-sm">{msg.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-400 text-sm">No messages yet</p>
                )}
              </div>
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="input-field" />
                <button type="submit" className="btn-primary shrink-0"><PaperAirplaneIcon className="w-5 h-5" /></button>
              </form>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-3">Community Stats</h3>
            <div className="space-y-3">
              {[{ label: 'Members', value: community.stats?.totalMembers || 0 }, { label: 'Messages', value: community.stats?.totalMessages || 0 }, { label: 'Events', value: community.stats?.totalEvents || 0 }].map(s => (
                <div key={s.label}>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-1.5">
              <UserGroupIcon className="w-5 h-5 text-gray-500" />
              Members
            </h3>
            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {community.members?.slice(0, 10).map(m => (
                <div key={m.user?._id} className="flex items-center gap-2">
                  <Avatar name={m.user?.name} className="w-7 h-7 text-xs" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.user?.name}</p>
                    <p className="text-[11px] text-gray-400">{m.role}</p>
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
