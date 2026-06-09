import { Link, useLocation } from 'react-router-dom';
import {
  ChartBarIcon,
  UsersIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminSidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const links = [
    { to: '/admin/dashboard', icon: ChartBarIcon, label: 'Dashboard' },
    { to: '/admin/users', icon: UsersIcon, label: 'Users' },
    { to: '/admin/blogs', icon: DocumentTextIcon, label: 'Blogs' },
    { to: '/admin/questions', icon: QuestionMarkCircleIcon, label: 'Questions' },
    { to: '/admin/communities', icon: UserGroupIcon, label: 'Communities' },
    { to: '/admin/moderation-logs', icon: ClipboardDocumentListIcon, label: 'Moderation Logs' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <aside className="w-64 min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <div className="px-5 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <h2 className="text-base font-semibold">AlumniHive</h2>
        </div>
        <p className="text-[11px] uppercase tracking-widest text-gray-500 mt-1">Admin Portal</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm transition-all duration-150 ${
                active
                  ? 'bg-red-600 text-white font-medium shadow-lg shadow-red-600/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4 border-t border-gray-800 pt-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800/60 transition-all duration-150 cursor-pointer"
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
