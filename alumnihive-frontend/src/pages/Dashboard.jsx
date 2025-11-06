import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { communitiesAPI, blogsAPI, eventsAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { UserGroupIcon, BookOpenIcon, CalendarIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    communities: 0,
    blogs: 0,
    events: 0,
    mentorships: 0
  });
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
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-primary-100">
            {user?.role === 'student' 
              ? 'Explore communities, connect with mentors, and grow your network.'
              : 'Share your experience, mentor students, and engage with the community.'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={UserGroupIcon}
            title="Communities"
            value={user?.communities?.length || 0}
            color="blue"
            link="/communities"
          />
          <StatCard
            icon={BookOpenIcon}
            title="Blogs"
            value={recentBlogs.length}
            color="green"
            link="/blogs"
          />
          <StatCard
            icon={CalendarIcon}
            title="Events"
            value={upcomingEvents.length}
            color="purple"
            link="/events"
          />
          <StatCard
            icon={AcademicCapIcon}
            title="Mentorship"
            value={0}
            color="orange"
            link="/mentorship"
          />
        </div>

        {/* Recent Blogs */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Blogs</h2>
            <Link to="/blogs" className="text-primary-600 hover:text-primary-700 font-medium">
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : recentBlogs.length > 0 ? (
            <div className="space-y-4">
              {recentBlogs.map((blog) => (
                <Link
                  key={blog._id}
                  to={`/blogs/${blog.slug}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition"
                >
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {blog.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {blog.excerpt}
                  </p>
                  <div className="flex items-center text-sm text-gray-500">
                    <img
                      src={blog.author?.avatar}
                      alt={blog.author?.name}
                      className="w-6 h-6 rounded-full mr-2"
                    />
                    <span>{blog.author?.name}</span>
                    <span className="mx-2">•</span>
                    <span>{blog.readTime} min read</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No blogs available
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Upcoming Events</h2>
            <Link to="/events" className="text-primary-600 hover:text-primary-700 font-medium">
              View All →
            </Link>
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div
                  key={event._id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition"
                >
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {event.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {new Date(event.startDate).toLocaleDateString()} - {event.location.type}
                  </p>
                  <div className="flex items-center text-sm text-gray-500">
                    <span>{event.attendees?.length || 0} attendees</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No upcoming events
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

const StatCard = ({ icon: Icon, title, value, color, link }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <Link to={link}>
      <div className="card hover:shadow-lg transition cursor-pointer">
        <div className={`w-12 h-12 bg-gradient-to-br ${colors[color]} rounded-lg flex items-center justify-center mb-4`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <p className="text-gray-600 text-sm mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
    </Link>
  );
};

export default Dashboard;