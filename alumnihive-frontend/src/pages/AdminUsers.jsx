import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminLayout from '../components/Layout/AdminLayout';
import { adminAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const AdminUsers = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [mentorApplications, setMentorApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }

    loadUsers();
  }, [user, authLoading, navigate, search, status]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const [allUsersRes, pendingUsersRes, mentorApplicationsRes] = await Promise.all([
        adminAPI.getUsers({ search: search || undefined, status: status || undefined }),
        adminAPI.getUsers({ status: 'pending', limit: 200 }),
        adminAPI.getMentorApplications()
      ]);

      setUsers(allUsersRes.data.users || []);

      const pending = (pendingUsersRes.data.users || []).sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      setPendingUsers(pending);
      setMentorApplications((mentorApplicationsRes.data.users || []).filter((item) => item.mentorDetails?.applicationStatus === 'pending'));
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveMentor = async (userId) => {
    try {
      await adminAPI.approveMentorApplication(userId);
      toast.success('Mentor application approved');
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve mentor application');
    }
  };

  const handleRejectMentor = async (userId) => {
    try {
      await adminAPI.rejectMentorApplication(userId, { reason: 'Rejected by admin from mentor review' });
      toast.success('Mentor application rejected');
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject mentor application');
    }
  };

  const handleBlockToggle = async (targetUser) => {
    try {
      if (targetUser.isBlocked) {
        await adminAPI.unblockUser(targetUser._id, 'Unblocked by admin');
        toast.success('User unblocked');
      } else {
        await adminAPI.blockUser(targetUser._id, 'Blocked by admin');
        toast.success('User blocked');
      }
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const handleApprove = async (userId) => {
    try {
      await adminAPI.approveUser(userId);
      toast.success('User approved');
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve user');
    }
  };

  const handleReject = async (userId) => {
    try {
      await adminAPI.rejectUser(userId, { reason: 'Rejected by admin from manage users' });
      toast.success('User rejected');
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject user');
    }
  };

  return (
    <AdminLayout title="User Management">
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Pending Approvals (Oldest First)</h2>
          <span className="text-sm text-gray-500">{pendingUsers.length} pending</span>
        </div>

        {pendingUsers.length === 0 ? (
          <p className="text-sm text-gray-500">No pending users right now.</p>
        ) : (
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {pendingUsers.map((pending) => (
              <div key={pending._id} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">{pending.name}</p>
                  <p className="text-xs text-gray-600">{pending.email}</p>
                  <p className="text-xs text-gray-500 mt-1">Registered: {new Date(pending.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(pending._id)}
                    className="rounded-lg px-3 py-1 text-sm bg-emerald-100 text-emerald-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(pending._id)}
                    className="rounded-lg px-3 py-1 text-sm bg-red-100 text-red-700"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Mentor Applications</h2>
          <span className="text-sm text-gray-500">{mentorApplications.length} pending</span>
        </div>

        {mentorApplications.length === 0 ? (
          <p className="text-sm text-gray-500">No mentor applications waiting for review.</p>
        ) : (
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {mentorApplications.map((application) => (
              <div key={application._id} className="border border-gray-200 rounded-lg p-3 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-medium text-sm">{application.name}</p>
                  <p className="text-xs text-gray-600">{application.email}</p>
                  <p className="text-xs text-gray-500">Expertise: {(application.mentorDetails?.expertise || []).join(', ') || 'N/A'}</p>
                  <p className="text-xs text-gray-500">Availability: {application.mentorDetails?.availability || 'N/A'}</p>
                  <p className="text-xs text-gray-500">Bio: {application.mentorDetails?.bio || 'N/A'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApproveMentor(application._id)}
                    className="rounded-lg px-3 py-1 text-sm bg-emerald-100 text-emerald-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleRejectMentor(application._id)}
                    className="rounded-lg px-3 py-1 text-sm bg-red-100 text-red-700"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <div className="grid md:grid-cols-3 gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, college"
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="blocked">Blocked</option>
          </select>
          <button
            onClick={loadUsers}
            className="bg-gray-900 text-white rounded-lg px-4 py-2"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 text-sm font-semibold">Name</th>
              <th className="text-left p-3 text-sm font-semibold">Email</th>
              <th className="text-left p-3 text-sm font-semibold">Role</th>
              <th className="text-left p-3 text-sm font-semibold">Status</th>
              <th className="text-right p-3 text-sm font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-4 text-sm text-gray-500" colSpan={5}>Loading users...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td className="p-4 text-sm text-gray-500" colSpan={5}>No users found</td>
              </tr>
            ) : (
              users.map((item) => (
                <tr key={item._id} className="border-t border-gray-100">
                  <td className="p-3 text-sm">{item.name}</td>
                  <td className="p-3 text-sm">{item.email}</td>
                  <td className="p-3 text-sm capitalize">{item.role}</td>
                  <td className="p-3 text-sm">
                    {item.isBlocked
                      ? 'Blocked'
                      : item.isApprovedByAdmin
                        ? 'Approved'
                        : 'Pending'}
                  </td>
                  <td className="p-3 text-right">
                    {item.role !== 'admin' && (
                      <button
                        onClick={() => handleBlockToggle(item)}
                        className={`rounded-lg px-3 py-1 text-sm ${
                          item.isBlocked
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {item.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
