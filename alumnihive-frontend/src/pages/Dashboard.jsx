import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { blogsAPI, eventsAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { UserGroupIcon, BookOpenIcon, CalendarIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import Avatar from '../components/Avatar';

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
        blogsAPI.getBlogs({ limit: 3 }),
        eventsAPI.getEvents({ status: 'upcoming', limit: 3 })
      ]);
      setRecentBlogs(blogsRes.data.blogs);
      setUpcomingEvents(eventsRes.data.events);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 sm:p-8 text-white">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1.5">Welcome back, {user?.name}</h1>
          <p className="text-primary-100 text-sm">
            {user?.role === 'student' 
              ? 'Explore communities, connect with mentors, and grow your network.'
              : 'Share your experience, mentor students, and engage with the community.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={UserGroupIcon} title="Communities" value={user?.communities?.length || 0} link="/communities" />
          <StatCard icon={BookOpenIcon} title="Blogs" value={recentBlogs.length} link="/blogs" />
          <StatCard icon={CalendarIcon} title="Events" value={upcomingEvents.length} link="/events" />
          <StatCard icon={AcademicCapIcon} title="Mentorship" value={0} link="/mentorship" />
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-gray-900">Recent Blogs</h2>
            <Link to="/blogs" className="text-link text-sm">View All</Link>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
          ) : recentBlogs.length > 0 ? (
            <div className="space-y-3">
              {recentBlogs.map((blog) => (
                <Link key={blog._id} to={`/blogs/${blog.slug}`} className="block p-4 border border-gray-100 rounded-xl hover:border-primary-200 hover:shadow-card-hover transition-all duration-200">
                  <h3 className="font-semibold text-gray-900 mb-1">{blog.title}</h3>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-2">{blog.excerpt}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Avatar name={blog.author?.name} className="w-5 h-5 text-[10px]" />
                    <span>{blog.author?.name}</span>
                    <span>•</span>
                    <span>{blog.readTime} min read</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">No blogs available</div>
          )}
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-gray-900">Upcoming Events</h2>
            <Link to="/events" className="text-link text-sm">View All</Link>
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event._id} className="p-4 border border-gray-100 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-1">{event.title}</h3>
                  <p className="text-sm text-gray-500 mb-1">{new Date(event.startDate).toLocaleDateString()} - {event.location?.type}</p>
                  <div className="text-xs text-gray-400">{event.attendees?.length || 0} attendees</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">No upcoming events</div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

const StatCard = ({ icon: Icon, title, value, link }) => (
  <Link to={link} className="card hover:shadow-card-hover transition-all duration-200 cursor-pointer">
    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
      <Icon className="w-5 h-5 text-primary-600" />
    </div>
    <p className="text-gray-500 text-xs mb-0.5">{title}</p>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
  </Link>
);

export default Dashboard;
