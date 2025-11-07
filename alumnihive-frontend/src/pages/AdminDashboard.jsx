import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MainLayout from '../components/Layout/MainLayout';
import toast from 'react-hot-toast';
import api from '../services/api';
import { CheckCircleIcon, XCircleIcon, UserIcon, UsersIcon } from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/pending-approvals')
      ]);

      setStats(statsRes.data.stats);
      setPendingUsers(usersRes.data.users);
    } catch (error) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      await api.post(`/admin/approve/${userId}`);
      toast.success('User approved!');
      loadData();
    } catch (error) {
      toast.error('Failed to approve user');
    }
  };

  const handleRejectUser = async (userId) => {
    try {
      await api.post(`/admin/reject/${userId}`, {
        reason: 'Rejected by admin'
      });
      toast.success('User rejected!');
      loadData();
    } catch (error) {
      toast.error('Failed to reject user');
    }
  };

  if (!stats || loading) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Stats */}
        <div>
          <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <StatCard label="Total Users" value={stats.totalUsers} color="blue" />
            <StatCard label="Pending Approvals" value={stats.pendingApprovals} color="yellow" />
            <StatCard label="Approved Users" value={stats.approvedUsers} color="green" />
            <StatCard label="Students" value={stats.students} color="purple" />
            <StatCard label="Alumni" value={stats.alumni} color="indigo" />
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Pending User Approvals</h2>
          {pendingUsers.length > 0 ? (
            <div className="space-y-4">
              {pendingUsers.map(user => (
                <div key={user._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-xs text-gray-500 mt-1">Role: {user.role} | College: {user.college}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApproveUser(user._id)}
                      className="btn-primary flex items-center space-x-1"
                    >
                      <CheckCircleIcon className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleRejectUser(user._id)}
                      className="btn-secondary flex items-center space-x-1 text-red-600"
                    >
                      <XCircleIcon className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No pending approvals</p>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

const StatCard = ({ label, value, color }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    yellow: 'from-yellow-500 to-yellow-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    indigo: 'from-indigo-500 to-indigo-600'
  };

  return (
    <div className="card">
      <div className={`w-12 h-12 bg-gradient-to-br ${colors[color]} rounded-lg mb-4`}></div>
      <p className="text-gray-600 text-sm">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
};

export default AdminDashboard;