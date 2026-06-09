import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import {
  BellIcon, UserCircleIcon, ArrowRightOnRectangleIcon, CheckIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect, useCallback } from 'react';
import { usersAPI } from '../../services/api';
import Avatar from '../Avatar';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { unreadCount: socketUnreadCount, clearUnreadCount } = useSocket();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const response = await usersAPI.getNotifications({ limit: 5 });
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadNotifications();
  }, [user, loadNotifications]);

  const handleBellClick = () => {
    const opening = !showNotifications;
    setShowNotifications(opening);
    if (opening) {
      clearUnreadCount();
      loadNotifications();
    }
  };

  const handleNotificationClick = async (notif) => {
    setShowNotifications(false);
    if (!notif.isRead) {
      try {
        await usersAPI.markNotificationRead(notif._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await Promise.all(
        notifications.filter((n) => !n.isRead).map((n) => usersAPI.markNotificationRead(n._id))
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-lg font-bold text-gray-900">AlumniHive</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={handleBellClick}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 cursor-pointer relative"
                aria-label="Notifications"
              >
                <BellIcon className="w-5 h-5" />
                {(socketUnreadCount > 0 || notifications.some((n) => !n.isRead)) && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {Math.max(socketUnreadCount, notifications.filter((n) => !n.isRead).length) > 9
                      ? '9+'
                      : Math.max(socketUnreadCount, notifications.filter((n) => !n.isRead).length)}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-modal border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                      {notifications.some((n) => !n.isRead) && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 cursor-pointer"
                        >
                          <CheckIcon className="w-3.5 h-3.5" />
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div
                            key={notif._id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-3.5 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors duration-150 ${
                              !notif.isRead ? 'bg-primary-50/50' : ''
                            }`}
                          >
                            <p className="font-medium text-sm text-gray-900">{notif.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-gray-400 text-sm">No notifications</div>
                      )}
                    </div>
                    <Link
                      to="/notifications"
                      onClick={() => setShowNotifications(false)}
                      className="block p-3 text-center text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-b-xl border-t border-gray-100 transition-colors duration-150"
                    >
                      View All Notifications
                    </Link>
                  </div>
                </>
              )}
            </div>

            <div className="relative group">
              <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-all duration-200 cursor-pointer">
                <Avatar name={user?.name} className="w-8 h-8 ring-2 ring-gray-200" />
                <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                  {user?.name}
                </span>
              </button>

              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-modal border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <Link
                  to={`/profile/${user?._id}`}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-t-xl transition-colors duration-150"
                >
                  <UserCircleIcon className="w-4 h-4 text-gray-400" />
                  Profile
                </Link>
                <div className="border-t border-gray-100" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-b-xl transition-colors duration-150 cursor-pointer"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
