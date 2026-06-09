import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { blogsAPI, eventsAPI } from '../services/api';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';
import {
  PencilSquareIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  ClockIcon,
  MapPinIcon,
  ChevronRightIcon,
  SparklesIcon,
  BookOpenIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';

const quickActions = [
  { label: 'Write Blog', icon: PencilSquareIcon, to: '/blogs/create', color: 'from-blue-500 to-blue-600' },
  { label: 'Find Mentor', icon: AcademicCapIcon, to: '/mentorship', color: 'from-emerald-500 to-emerald-600' },
  { label: 'Browse Events', icon: CalendarDaysIcon, to: '/events', color: 'from-violet-500 to-violet-600' },
  { label: 'Communities', icon: UserGroupIcon, to: '/communities', color: 'from-amber-500 to-amber-600' },
];

const Dashboard = () => {
  const { user } = useAuth();
  const [recentBlogs, setRecentBlogs] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [blogsRes, eventsRes] = await Promise.all([
        blogsAPI.getBlogs({ limit: 4 }),
        eventsAPI.getEvents({ status: 'upcoming', limit: 4 })
      ]);
      setRecentBlogs(blogsRes.data.blogs || []);
      setUpcomingEvents(eventsRes.data.events || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-8">
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
          <div className="flex items-start gap-5">
            <Avatar name={user?.name} className="w-16 h-16 sm:w-20 sm:h-20 text-2xl ring-4 ring-primary-50" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{user?.name}</h1>
                <SparklesIcon className="w-5 h-5 text-amber-400 shrink-0" />
              </div>
              <p className="text-sm text-gray-500 mb-1">
                {user?.role === 'alumni' ? user?.currentPosition : 'Student'} {user?.college ? `at ${user.college}` : ''}
              </p>
              {user?.bio && <p className="text-sm text-gray-400 line-clamp-2">{user.bio}</p>}
            </div>
            <Link
              to="/profile"
              className="hidden sm:flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium shrink-0"
            >
              View Profile <ChevronRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className="group relative overflow-hidden rounded-xl p-4 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-200 bg-gradient-to-br ${action.color}`} />
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${action.color} mb-3`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <p className="font-semibold text-gray-900 text-sm">{action.label}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={BookOpenIcon} label="Blogs" value={recentBlogs.length} to="/blogs" />
          <StatCard icon={UserGroupIcon} label="Communities" value={user?.communities?.length || 0} to="/communities" />
          <StatCard icon={CalendarDaysIcon} label="Events" value={upcomingEvents.length} to="/events" />
          <StatCard icon={ChatBubbleLeftIcon} label="Messages" value={0} to="/chat" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">Recent Blogs</h2>
              <Link to="/blogs" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                View all <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentBlogs.length > 0 ? (
              <div className="space-y-4">
                {recentBlogs.map((blog) => (
                  <Link
                    key={blog._id}
                    to={`/blogs/${blog.slug}`}
                    className="flex items-start gap-3 group"
                  >
                    <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-primary-100 transition-colors">
                      <BookOpenIcon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm group-hover:text-primary-600 transition-colors line-clamp-1">{blog.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{blog.author?.name} • {blog.readTime} min read</p>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors shrink-0 mt-0.5" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">No blogs yet</div>
            )}
            {!loading && (
              <Link to="/blogs/create" className="mt-5 block text-center text-sm text-primary-600 hover:text-primary-700 font-medium py-2.5 border border-dashed border-gray-200 rounded-xl hover:border-primary-300 transition-colors">
                + Write a new blog
              </Link>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">Upcoming Events</h2>
              <Link to="/events" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                View all <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <Link
                    key={event._id}
                    to={`/events/${event._id}`}
                    className="flex items-start gap-3 group"
                  >
                    <div className="w-12 h-12 bg-amber-50 rounded-lg flex flex-col items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
                      <span className="text-xs font-bold text-amber-600 leading-none">{new Date(event.startDate).getDate()}</span>
                      <span className="text-[10px] text-amber-500 leading-none mt-0.5">
                        {new Date(event.startDate).toLocaleString('default', { month: 'short' })}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm group-hover:text-primary-600 transition-colors line-clamp-1">{event.title}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                        <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3" />{new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {event.location?.type && <span className="flex items-center gap-1"><MapPinIcon className="w-3 h-3" />{event.location.type}</span>}
                      </div>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors shrink-0 mt-0.5" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">No upcoming events</div>
            )}
            {!loading && (
              <Link to="/events/create" className="mt-5 block text-center text-sm text-primary-600 hover:text-primary-700 font-medium py-2.5 border border-dashed border-gray-200 rounded-xl hover:border-primary-300 transition-colors">
                + Create an event
              </Link>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

const StatCard = ({ icon: Icon, label, value, to }) => (
  <Link
    to={to}
    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-100 transition-all duration-200 group"
  >
    <div className="flex items-center justify-between mb-2">
      <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-primary-50 transition-colors">
        <Icon className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
      </div>
    </div>
    <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>
    <p className="text-xs text-gray-400">{label}</p>
  </Link>
);

export default Dashboard;
