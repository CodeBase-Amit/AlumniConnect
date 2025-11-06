import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, UserGroupIcon, AcademicCapIcon, 
  BookOpenIcon, QuestionMarkCircleIcon, CalendarIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const location = useLocation();

  const links = [
    { to: '/', icon: HomeIcon, label: 'Dashboard' },
    { to: '/communities', icon: UserGroupIcon, label: 'Communities' },
    { to: '/mentorship', icon: AcademicCapIcon, label: 'Mentorship' },
    { to: '/blogs', icon: BookOpenIcon, label: 'Blogs' },
    { to: '/questions', icon: QuestionMarkCircleIcon, label: 'Q&A' },
    { to: '/events', icon: CalendarIcon, label: 'Events' },
    { to: '/chat', icon: ChatBubbleLeftRightIcon, label: 'Chat' },
  ];

  return (
    <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-4 space-y-2">
        {links.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              location.pathname === to
                ? 'bg-primary-50 text-primary-700 font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;