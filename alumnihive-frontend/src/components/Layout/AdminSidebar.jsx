import { Link, useLocation } from 'react-router-dom';
import {
  ChartBarIcon,
  UsersIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

const AdminSidebar = () => {
  const location = useLocation();

  const links = [
    { to: '/admin/dashboard', icon: ChartBarIcon, label: 'Dashboard' },
    { to: '/admin/users', icon: UsersIcon, label: 'Users' },
    { to: '/admin/blogs', icon: DocumentTextIcon, label: 'Blogs' },
    { to: '/admin/questions', icon: QuestionMarkCircleIcon, label: 'Questions' },
    { to: '/admin/communities', icon: UserGroupIcon, label: 'Communities' },
    { to: '/admin/moderation-logs', icon: ClipboardDocumentListIcon, label: 'Moderation Logs' }
  ];

  return (
    <aside className="w-72 bg-gray-950 text-gray-100 min-h-screen border-r border-gray-800">
      <div className="px-6 py-6 border-b border-gray-800">
        <p className="text-xs uppercase tracking-widest text-gray-400">Admin Portal</p>
        <h2 className="text-xl font-semibold mt-2">AlumniHive</h2>
      </div>

      <nav className="px-4 py-4 space-y-2">
        {links.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to;

          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition ${
                active
                  ? 'bg-red-600 text-white'
                  : 'text-gray-300 hover:bg-gray-900 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
