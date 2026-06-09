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
    if (authLoading) return;
    if (!user || user.role !== 'admin') { navigate('/admin/login'); return; }
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
      setPendingUsers((pendingUsersRes.data.users || []).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
      setMentorApplications((mentorApplicationsRes.data.users || []).filter(item => item.mentorDetails?.applicationStatus === 'pending'));
    } catch (error) { toast.error('Failed to load users'); } finally { setLoading(false); }
  };

  const handleApproveMentor = async (userId) => {
    try { await adminAPI.approveMentorApplication(userId); toast.success('Mentor approved'); loadUsers(); }
    catch (error) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  const handleRejectMentor = async (userId) => {
    try { await adminAPI.rejectMentorApplication(userId, { reason: 'Rejected by admin' }); toast.success('Mentor rejected'); loadUsers(); }
    catch (error) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  const handleBlockToggle = async (targetUser) => {
    try {
      if (targetUser.isBlocked) { await adminAPI.unblockUser(targetUser._id, 'Unblocked'); toast.success('User unblocked'); }
      else { await adminAPI.blockUser(targetUser._id, 'Blocked'); toast.success('User blocked'); }
      loadUsers();
    } catch (error) { toast.error(error.response?.data?.message || 'Action failed'); }
  };

  const handleApprove = async (userId) => {
    try { await adminAPI.approveUser(userId); toast.success('User approved'); loadUsers(); }
    catch (error) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  const handleReject = async (userId) => {
    try { await adminAPI.rejectUser(userId, { reason: 'Rejected by admin' }); toast.success('User rejected'); loadUsers(); }
    catch (error) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  return (
    <AdminLayout title="User Management">
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3"><h2 className="text-sm font-semibold text-gray-900">Pending Approvals</h2><span className="text-xs text-gray-500">{pendingUsers.length} pending</span></div>
        {pendingUsers.length === 0 ? <p className="text-xs text-gray-400">No pending users.</p> : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {pendingUsers.map(pending => (
              <div key={pending._id} className="flex items-center justify-between p-2.5 border border-gray-100 rounded-lg">
                <div className="min-w-0"><p className="font-medium text-sm text-gray-900">{pending.name}</p><p className="text-xs text-gray-500">{pending.email}</p></div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => handleApprove(pending._id)} className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded text-xs font-medium hover:bg-emerald-200 cursor-pointer">Approve</button>
                  <button onClick={() => handleReject(pending._id)} className="bg-red-100 text-red-700 px-2.5 py-1 rounded text-xs font-medium hover:bg-red-200 cursor-pointer">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3"><h2 className="text-sm font-semibold text-gray-900">Mentor Applications</h2><span className="text-xs text-gray-500">{mentorApplications.length} pending</span></div>
        {mentorApplications.length === 0 ? <p className="text-xs text-gray-400">No mentor applications.</p> : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {mentorApplications.map(app => (
              <div key={app._id} className="p-3 border border-gray-100 rounded-lg">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="min-w-0"><p className="font-medium text-sm text-gray-900">{app.name}</p><p className="text-xs text-gray-500">{app.email}</p></div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => handleApproveMentor(app._id)} className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded text-xs font-medium hover:bg-emerald-200 cursor-pointer">Approve</button>
                    <button onClick={() => handleRejectMentor(app._id)} className="bg-red-100 text-red-700 px-2.5 py-1 rounded text-xs font-medium hover:bg-red-200 cursor-pointer">Reject</button>
                  </div>
                </div>
                <p className="text-xs text-gray-400">Expertise: {(app.mentorDetails?.expertise || []).join(', ') || 'N/A'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email..." className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="blocked">Blocked</option>
          </select>
          <button onClick={loadUsers} className="bg-gray-900 text-white rounded-lg px-4 py-2 text-sm hover:bg-gray-800 transition cursor-pointer">Refresh</button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50"><tr>
            <th className="table-header">Name</th><th className="table-header">Email</th><th className="table-header">Role</th><th className="table-header">Status</th><th className="table-header text-right">Action</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td className="p-4 text-sm text-gray-400" colSpan={5}>Loading...</td></tr> : users.length === 0 ? <tr><td className="p-4 text-sm text-gray-400" colSpan={5}>No users found</td></tr> : (
              users.map((item) => (
                <tr key={item._id} className="border-t border-gray-50">
                  <td className="table-cell font-medium">{item.name}</td>
                  <td className="table-cell text-gray-500">{item.email}</td>
                  <td className="table-cell capitalize">{item.role}</td>
                  <td className="table-cell">{item.isBlocked ? 'Blocked' : item.isApprovedByAdmin ? 'Approved' : 'Pending'}</td>
                  <td className="table-cell text-right">{item.role !== 'admin' && (
                    <button onClick={() => handleBlockToggle(item)} className={`rounded-lg px-3 py-1 text-xs font-medium ${item.isBlocked ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-100 text-red-700 hover:bg-red-200'} cursor-pointer transition`}>{item.isBlocked ? 'Unblock' : 'Block'}</button>
                  )}</td>
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
