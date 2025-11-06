import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  HomeIcon, UserGroupIcon, AcademicCapIcon, 
  BookOpenIcon, QuestionMarkCircleIcon, CalendarIcon,
  BellIcon, UserCircleIcon, ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { usersAPI } from '../../services/api';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await usersAPI.getNotifications({ limit: 5 });
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-xl font-bold text-gray-900">AlumniHive</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLink to="/" icon={HomeIcon}>Dashboard</NavLink>
            <NavLink to="/communities" icon={UserGroupIcon}>Communities</NavLink>
            <NavLink to="/mentorship" icon={AcademicCapIcon}>Mentorship</NavLink>
            <NavLink to="/blogs" icon={BookOpenIcon}>Blogs</NavLink>
            <NavLink to="/questions" icon={QuestionMarkCircleIcon}>Q&A</NavLink>
            <NavLink to="/events" icon={CalendarIcon}>Events</NavLink>
            <NavLink to="/chat" icon={ChatBubbleLeftRightIcon}>Chat</NavLink>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg relative"
              >
                <BellIcon className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                            !notif.isRead ? 'bg-blue-50' : ''
                          }`}
                        >
                          <p className="font-medium text-sm">{notif.title}</p>
                          <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        No notifications
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative group">
              <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100">
                <img
                  src={user?.avatar || 'https://via.placeholder.com/40'}
                  alt={user?.name}
                  className="w-8 h-8 rounded-full"
                />
                <span className="hidden md:block text-sm font-medium text-gray-700">
                  {user?.name}
                </span>
              </button>

              {/* Profile Dropdown */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <Link
                  to={`/profile/${user?._id}`}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
                >
                  <UserCircleIcon className="w-4 h-4 inline mr-2" />
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-b-lg"
                >
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

const NavLink = ({ to, icon: Icon, children }) => {
  return (
    <Link
      to={to}
      className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <Icon className="w-5 h-5" />
      <span>{children}</span>
    </Link>
  );
};

export default Navbar;