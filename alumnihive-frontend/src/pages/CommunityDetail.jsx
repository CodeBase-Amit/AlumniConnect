import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { communitiesAPI, messagesAPI } from '../services/api';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import {
  PaperAirplaneIcon,
  UserGroupIcon,
  ChatBubbleLeftIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  HashtagIcon,
} from '@heroicons/react/24/outline';
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

  const roleBadge = (role) => {
    if (role === 'Admin') return <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">Admin</span>;
    if (role === 'Moderator') return <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Moderator</span>;
    return <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Member</span>;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="h-48 bg-gray-200" />
              <div className="p-6 space-y-3">
                <div className="h-7 bg-gray-200 rounded-lg w-3/5" />
                <div className="h-4 bg-gray-200 rounded-lg w-full" />
                <div className="h-4 bg-gray-200 rounded-lg w-4/5" />
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              <div className="h-5 bg-gray-200 rounded-lg w-1/4" />
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                      <div className="h-8 bg-gray-200 rounded-lg w-full" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="h-10 bg-gray-200 rounded-xl w-full" />
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              <div className="h-5 bg-gray-200 rounded-lg w-1/3" />
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="space-y-1">
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                    <div className="h-6 bg-gray-200 rounded w-1/3" />
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              <div className="h-5 bg-gray-200 rounded-lg w-1/3" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-3 bg-gray-200 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!community) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <HashtagIcon className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500 text-sm font-medium">Community not found</p>
          <p className="text-gray-400 text-xs mt-1">This community may have been removed or doesn't exist.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <CoverImage type="community" className="w-full h-48" title={community.name} />
            <div className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-gray-900">{community.name}</h1>
                  <p className="text-gray-500 text-sm mt-2 leading-relaxed">{community.description}</p>
                </div>
                {!isMember ? (
                  <button onClick={handleJoinCommunity} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shrink-0 shadow-sm">
                    <UserGroupIcon className="w-4 h-4" />
                    Join Community
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-xl shrink-0">
                    <ShieldCheckIcon className="w-4 h-4" />
                    Member
                  </span>
                )}
              </div>
            </div>
          </div>

          {isMember && (
            <div className="bg-white rounded-2xl shadow-sm flex flex-col h-[500px]">
              <div className="px-6 pt-5 pb-3 border-b border-gray-100">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <ChatBubbleLeftIcon className="w-5 h-5 text-gray-500" />
                  Chat
                  <span className="ml-auto text-xs font-normal text-gray-400">{messages.length} messages</span>
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {messages.length > 0 ? (
                  messages.map(msg => {
                    const isOwn = msg.sender?._id === user._id;
                    return (
                      <div key={msg._id} className={`flex items-start gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                        <Avatar name={msg.sender?.name} className="w-8 h-8 text-xs shrink-0 mt-0.5" />
                        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[75%]`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-medium ${isOwn ? 'text-indigo-600' : 'text-gray-700'}`}>
                              {msg.sender?.name || 'Unknown'}
                            </span>
                            {msg.sender?.role && (
                              <span className="text-[10px] text-gray-400">{msg.sender.role}</span>
                            )}
                          </div>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isOwn
                              ? 'bg-indigo-600 text-white rounded-tr-md'
                              : 'bg-gray-100 text-gray-800 rounded-tl-md'
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                      <ChatBubbleLeftIcon className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium">No messages yet</p>
                    <p className="text-gray-400 text-xs mt-1">Be the first to start the conversation!</p>
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-gray-100">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 shadow-sm"
                  >
                    <PaperAirplaneIcon className="w-5 h-5 rotate-90" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-5">
              <HashtagIcon className="w-5 h-5 text-gray-500" />
              Community Stats
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Members', value: community.stats?.totalMembers || 0, icon: UserGroupIcon, color: 'text-blue-600 bg-blue-50' },
                { label: 'Messages', value: community.stats?.totalMessages || 0, icon: ChatBubbleLeftIcon, color: 'text-violet-600 bg-violet-50' },
                { label: 'Events', value: community.stats?.totalEvents || 0, icon: HashtagIcon, color: 'text-emerald-600 bg-emerald-50' },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="text-center p-3 rounded-xl bg-gray-50">
                    <div className={`w-9 h-9 mx-auto mb-2 rounded-full flex items-center justify-center ${s.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <UserGroupIcon className="w-5 h-5 text-gray-500" />
              Members
              <span className="ml-auto text-xs font-normal text-gray-400">{community.members?.length || 0}</span>
            </h3>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {community.members?.length > 0 ? (
                community.members.slice(0, 15).map(m => (
                  <div key={m.user?._id} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <Avatar name={m.user?.name} className="w-9 h-9 text-xs shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{m.user?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-400 truncate">{m.user?.email || ''}</p>
                    </div>
                    {roleBadge(m.role)}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                    <UserGroupIcon className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-gray-500 text-xs">No members yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CommunityDetail;
