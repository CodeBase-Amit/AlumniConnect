import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI } from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import { CheckIcon, BellIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import MainLayout from '../components/Layout/MainLayout';

const PAGE_SIZE = 20;

const typeIcons = {
  mentorship_request: 'bg-blue-100 text-blue-600',
  mentorship_accepted: 'bg-green-100 text-green-600',
  session_scheduled: 'bg-purple-100 text-purple-600',
  session_completed: 'bg-emerald-100 text-emerald-600',
  feedback_received: 'bg-yellow-100 text-yellow-600',
  message: 'bg-indigo-100 text-indigo-600',
  mention: 'bg-orange-100 text-orange-600',
  comment: 'bg-teal-100 text-teal-600',
  like: 'bg-pink-100 text-pink-600',
  follow: 'bg-sky-100 text-sky-600',
  event_reminder: 'bg-amber-100 text-amber-600',
  community_invite: 'bg-violet-100 text-violet-600',
  community_post: 'bg-cyan-100 text-cyan-600',
  answer: 'bg-lime-100 text-lime-600',
  question_solved: 'bg-emerald-100 text-emerald-600',
  approval: 'bg-green-100 text-green-600',
  rejection: 'bg-red-100 text-red-600',
  system: 'bg-gray-100 text-gray-600',
};

export default function Notifications() {
  const { clearUnreadCount } = useSocket();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    clearUnreadCount();
  }, [clearUnreadCount]);

  useEffect(() => {
    loadNotifications();
  }, [page]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await usersAPI.getNotifications({ limit: PAGE_SIZE, page });
      setNotifications(response.data.notifications || []);
      setTotalPages(response.data.totalPages || 1);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notif) => {
    if (notif.isRead) return;
    try {
      await usersAPI.markNotificationRead(notif._id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await Promise.all(
        notifications.filter((n) => !n.isRead).map((n) => usersAPI.markNotificationRead(n._id))
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getTimeAgo = (dateStr) => {
    const now = Date.now();
    const diff = now - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-500 mt-0.5">{unreadCount} unread</p>
              )}
            </div>
          </div>
          {notifications.some((n) => !n.isRead) && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors cursor-pointer"
            >
              <CheckIcon className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <BellIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No notifications</h3>
            <p className="text-sm text-gray-500">You're all caught up!</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => {
                    handleMarkAsRead(notif);
                    if (notif.link) navigate(notif.link);
                  }}
                  className={`bg-white rounded-2xl p-5 border shadow-sm transition-all duration-150 cursor-pointer hover:shadow-md ${
                    !notif.isRead
                      ? 'border-primary-200 bg-primary-50/30'
                      : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        typeIcons[notif.type] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <BellIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm text-gray-900">{notif.title}</p>
                        <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                          {getTimeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{notif.message}</p>
                      {notif.sender && (
                        <p className="text-xs text-gray-400 mt-1.5">
                          From: {notif.sender.name}
                        </p>
                      )}
                    </div>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}