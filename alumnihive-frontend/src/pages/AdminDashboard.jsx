import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/Layout/AdminLayout';
import toast from 'react-hot-toast';
import { adminAPI } from '../services/api';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

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

  if (!stats || loading) return <AdminLayout title="Admin Dashboard"><div className="text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-[3px] border-red-600 border-t-transparent mx-auto"></div></div></AdminLayout>;

  return (
    <AdminLayout title="Admin Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Users', value: stats.totalUsers },
            { label: 'Pending', value: stats.pendingApprovals },
            { label: 'Approved', value: stats.approvedUsers },
            { label: 'Students', value: stats.students },
            { label: 'Alumni', value: stats.alumni }
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg mb-3"></div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: '/admin/users', label: 'Manage Users' },
            { to: '/admin/blogs', label: 'Moderate Blogs' },
            { to: '/admin/questions', label: 'Moderate Questions' },
            { to: '/admin/communities', label: 'Moderate Communities' }
          ].map(l => (
            <Link key={l.to} to={l.to} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-400 transition">
              <p className="text-xs text-gray-500">Admin</p>
              <p className="font-semibold text-sm mt-1">{l.label}</p>
            </Link>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Pending User Approvals</h2>
          {pendingUsers.length > 0 ? (
            <div className="space-y-3">
              {pendingUsers.map(user => (
                <div key={user._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-gray-900">{user.name}</h3>
                    <p className="text-xs text-gray-500">{user.email} • {user.role} • {user.college}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleApproveUser(user._id)} className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-200 transition cursor-pointer">
                      <CheckCircleIcon className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => handleRejectUser(user._id)} className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-200 transition cursor-pointer">
                      <XCircleIcon className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 text-sm py-6">No pending approvals</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
