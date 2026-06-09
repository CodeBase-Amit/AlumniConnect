import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  BellIcon, UserCircleIcon, ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { usersAPI } from '../../services/api';
import Avatar from '../Avatar';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    try {
      const response = await usersAPI.getNotifications({ limit: 5 });
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
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
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 cursor-pointer relative"
                aria-label="Notifications"
              >
                <BellIcon className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-modal border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div
                            key={notif._id}
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
