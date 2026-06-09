import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/Layout/AdminLayout';
import Avatar from '../components/Avatar';
import toast from 'react-hot-toast';
import { adminAPI } from '../services/api';
import {
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  BookOpenIcon,
  QuestionMarkCircleIcon,
  HashtagIcon,
} from '@heroicons/react/24/outline';

const statCards = [
  { label: 'Total Users', key: 'totalUsers', icon: UserGroupIcon, color: 'bg-red-500' },
  { label: 'Pending', key: 'pendingApprovals', icon: UserGroupIcon, color: 'bg-amber-500' },
  { label: 'Approved', key: 'approvedUsers', icon: UserGroupIcon, color: 'bg-emerald-500' },
  { label: 'Students', key: 'students', icon: UserGroupIcon, color: 'bg-blue-500' },
  { label: 'Alumni', key: 'alumni', icon: UserGroupIcon, color: 'bg-purple-500' },
];

const quickLinks = [
  { to: '/admin/users', label: 'Manage Users', icon: UserGroupIcon, desc: 'View & manage user accounts' },
  { to: '/admin/blogs', label: 'Moderate Blogs', icon: BookOpenIcon, desc: 'Review blog posts' },
  { to: '/admin/questions', label: 'Moderate Questions', icon: QuestionMarkCircleIcon, desc: 'Review community questions' },
  { to: '/admin/communities', label: 'Moderate Communities', icon: HashtagIcon, desc: 'Manage community groups' },
];

const SkeletonStats = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
    {statCards.map((s) => (
      <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 animate-pulse">
        <div className="w-11 h-11 rounded-xl bg-gray-200 mb-4" />
        <div className="h-3 bg-gray-200 rounded w-16 mb-2" />
        <div className="h-7 bg-gray-200 rounded w-12" />
      </div>
    ))}
  </div>
);

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    const hasToken = Boolean(sessionStorage.getItem('token') || localStorage.getItem('token'));
    if (!user && hasToken) return;
    if (!user || user.role !== 'admin') { navigate('/admin/login'); return; }
    loadData();
  }, [user, authLoading, navigate]);

  const loadData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([adminAPI.getStats(), adminAPI.getPendingApprovals()]);
      setStats(statsRes.data.stats);
      setPendingUsers(usersRes.data.users);
    } catch (error) { toast.error('Failed to load admin data'); } finally { setLoading(false); }
  };

  const handleApproveUser = async (userId) => {
    try { await adminAPI.approveUser(userId); toast.success('User approved!'); loadData(); }
    catch (error) { toast.error('Failed to approve user'); }
  };

  const handleRejectUser = async (userId) => {
    try { await adminAPI.rejectUser(userId, { reason: 'Rejected by admin' }); toast.success('User rejected!'); loadData(); }
    catch (error) { toast.error('Failed to reject user'); }
  };

  if (!stats || loading) {
    return (
      <AdminLayout title="Admin Dashboard">
        <SkeletonStats />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Admin Dashboard">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className={`w-11 h-11 ${s.color} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats[s.key]}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:border-red-200 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-red-100 transition-colors">
                  <Icon className="w-5 h-5 text-red-600" />
                </div>
                <p className="font-semibold text-sm text-gray-900 group-hover:text-red-700 transition-colors">{link.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{link.desc}</p>
              </Link>
            );
          })}
        </div>

        {/* Pending Approvals */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Pending User Approvals</h2>
            {pendingUsers.length > 0 && (
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                {pendingUsers.length}
              </span>
            )}
          </div>

          {pendingUsers.length > 0 ? (
            <div className="space-y-3">
              {pendingUsers.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={u.name} className="w-10 h-10 shrink-0" />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-gray-900 truncate">{u.name}</h3>
                      <p className="text-xs text-gray-500 truncate">
                        {u.email} &middot; {u.role} &middot; {u.college}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-3">
                    <button
                      onClick={() => handleApproveUser(u._id)}
                      className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer border border-emerald-200"
                    >
                      <CheckCircleIcon className="w-4 h-4" /> Approve
                    </button>
                    <button
                      onClick={() => handleRejectUser(u._id)}
                      className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors cursor-pointer border border-red-200"
                    >
                      <XCircleIcon className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <UserGroupIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm font-medium">No pending approvals</p>
              <p className="text-gray-300 text-xs mt-1">All user requests have been reviewed</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
