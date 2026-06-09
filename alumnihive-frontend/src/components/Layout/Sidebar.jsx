import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, UserGroupIcon, AcademicCapIcon, 
  BookOpenIcon, QuestionMarkCircleIcon, CalendarIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

const links = [
  { to: '/', icon: HomeIcon, label: 'Dashboard' },
  { to: '/communities', icon: UserGroupIcon, label: 'Communities' },
  { to: '/mentorship', icon: AcademicCapIcon, label: 'Mentorship' },
  { to: '/blogs', icon: BookOpenIcon, label: 'Blogs' },
  { to: '/questions', icon: QuestionMarkCircleIcon, label: 'Q&A' },
  { to: '/events', icon: CalendarIcon, label: 'Events' },
  { to: '/chat', icon: ChatBubbleLeftRightIcon, label: 'Chat' },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="hidden lg:block w-64 bg-white border-r border-gray-200/60 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-1 sticky top-20">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 pb-2">Navigation</p>
        {links.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to || 
            (to !== '/' && location.pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                active
                  ? 'bg-primary-50 text-primary-700 font-semibold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-medium'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;
