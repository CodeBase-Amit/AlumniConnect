import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { messagesAPI } from '../services/api';
import {
  joinMentorshipRoom, leaveMentorshipRoom,
  sendMentorshipMessage
} from '../services/socket';
import Avatar from './Avatar';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

export default function MentorshipChat({ mentorship, onClose }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!mentorship?._id) return;
    joinMentorshipRoom(mentorship._id);
    loadMessages();
    return () => leaveMentorshipRoom(mentorship._id);
  }, [mentorship?._id]);

  useEffect(() => {
    if (!socket) return;
    const handler = (message) => {
      if (message.mentorship !== mentorship?._id) return;
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
    };
    socket.on('message:mentorship:new', handler);
    return () => socket.off('message:mentorship:new', handler);
  }, [socket, mentorship?._id]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const res = await messagesAPI.getMentorshipMessages(mentorship._id);
      setMessages(res.data.messages || []);
    } catch (error) {
      console.error('Failed to load mentorship messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    const content = input.trim();
    if (!content) return;
    sendMentorshipMessage({ mentorshipId: mentorship._id, content });
    setInput('');
  };

  const otherPerson = user?._id === mentorship.mentor?._id
    ? mentorship.mentee
    : mentorship.mentor;

  return (
    <div className="border-t border-gray-200 pt-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <h4 className="text-sm font-semibold text-gray-900">Mentorship Chat</h4>
          <span className="text-xs text-gray-400">with {otherPerson?.name || '...'}</span>
        </div>
        <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer">Hide</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="h-64 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                  <div className={`h-8 ${i % 2 === 0 ? 'w-32' : 'w-40'} bg-gray-200 rounded-xl`} />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-xs text-gray-400">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender?._id === user?._id;
              return (
                <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start gap-2 max-w-[75%] ${isMine ? 'flex-row-reverse' : ''}`}>
                    <Avatar name={msg.sender?.name} className="w-6 h-6 text-[9px] shrink-0 mt-0.5" />
                    <div>
                      <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed ${
                        isMine
                          ? 'bg-primary-500 text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                      }`}>
                        {msg.content}
                      </div>
                      <p className={`text-[10px] text-gray-400 mt-0.5 ${isMine ? 'text-right' : 'text-left'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="border-t border-gray-100 p-3 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}