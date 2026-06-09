import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminLayout from '../components/Layout/AdminLayout';
import { adminAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/Avatar';
import { UsersIcon, UserPlusIcon, AcademicCapIcon, MagnifyingGlassIcon, FunnelIcon, ArrowPathIcon, CheckCircleIcon, XCircleIcon, NoSymbolIcon, LockOpenIcon } from '@heroicons/react/24/outline';

const SkeletonBlock = ({ lines = 1 }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${70 + Math.random() * 30}%` }} />
    ))}
  </div>
);

const SkeletonTable = ({ rows = 4 }) => (
  <div className="divide-y divide-gray-100">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
        <div className="h-8 bg-gray-200 rounded animate-pulse w-20" />
      </div>
    ))}
  </div>
);

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

  const getStatusBadge = (item) => {
    if (item.isBlocked) return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 ring-1 ring-red-600/10"><NoSymbolIcon className="w-3.5 h-3.5" />Blocked</span>;
    if (item.isApprovedByAdmin) return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10"><CheckCircleIcon className="w-3.5 h-3.5" />Approved</span>;
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-600/10"><UserPlusIcon className="w-3.5 h-3.5" />Pending</span>;
  };

  return (
    <AdminLayout title="User Management">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-red-50 text-red-600">
                <UserPlusIcon className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900">Pending Approvals</h2>
            </div>
            <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-600">{pendingUsers.length}</span>
          </div>
          {loading ? <SkeletonBlock lines={3} /> : pendingUsers.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircleIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No pending users.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto -mx-1">
              {pendingUsers.map(pending => (
                <div key={pending._id} className="flex items-center justify-between p-2.5 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={pending.name} className="w-8 h-8 text-xs shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{pending.name}</p>
                      <p className="text-xs text-gray-500 truncate">{pending.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => handleApprove(pending._id)} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors cursor-pointer ring-1 ring-emerald-600/10">
                      <CheckCircleIcon className="w-3.5 h-3.5" />Approve
                    </button>
                    <button onClick={() => handleReject(pending._id)} className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors cursor-pointer ring-1 ring-red-600/10">
                      <XCircleIcon className="w-3.5 h-3.5" />Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-red-50 text-red-600">
                <AcademicCapIcon className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900">Mentor Applications</h2>
            </div>
            <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-600">{mentorApplications.length}</span>
          </div>
          {loading ? <SkeletonBlock lines={3} /> : mentorApplications.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircleIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No mentor applications.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto -mx-1">
              {mentorApplications.map(app => (
                <div key={app._id} className="p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={app.name} className="w-8 h-8 text-xs shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{app.name}</p>
                        <p className="text-xs text-gray-500 truncate">{app.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => handleApproveMentor(app._id)} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors cursor-pointer ring-1 ring-emerald-600/10">
                        <CheckCircleIcon className="w-3.5 h-3.5" />Approve
                      </button>
                      <button onClick={() => handleRejectMentor(app._id)} className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors cursor-pointer ring-1 ring-red-600/10">
                        <XCircleIcon className="w-3.5 h-3.5" />Reject
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 ml-[2.625rem]">Expertise: {(app.mentorDetails?.expertise || []).join(', ') || 'N/A'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-5">
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email..." className="w-full border border-gray-300 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all" />
          </div>
          <div className="relative">
            <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border border-gray-300 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all appearance-none bg-white">
              <option value="">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="blocked">Blocked</option>
            </select>
          </div>
          <button onClick={loadUsers} className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer">
            <ArrowPathIcon className="w-4 h-4" />Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider p-3">User</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider p-3">Email</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider p-3">Role</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider p-3">Status</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="p-4"><SkeletonTable rows={4} /></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-sm text-gray-400">
                  <UsersIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  No users found
                </td></tr>
              ) : (
                users.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 text-sm text-gray-700">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={item.name} className="w-8 h-8 text-xs shrink-0" />
                        <span className="font-medium text-gray-900">{item.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-500">{item.email}</td>
                    <td className="p-3 text-sm text-gray-700 capitalize">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                        item.role === 'admin' ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/10' :
                        item.role === 'mentor' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/10' :
                        'bg-gray-50 text-gray-600 ring-1 ring-gray-600/10'
                      }`}>{item.role}</span>
                    </td>
                    <td className="p-3 text-sm text-gray-700">{getStatusBadge(item)}</td>
                    <td className="p-3 text-sm text-gray-700 text-right">
                      {item.role !== 'admin' && (
                        <button onClick={() => handleBlockToggle(item)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                          item.isBlocked
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-1 ring-emerald-600/10'
                            : 'bg-red-50 text-red-700 hover:bg-red-100 ring-1 ring-red-600/10'
                        }`}>
                          {item.isBlocked ? <><LockOpenIcon className="w-3.5 h-3.5" />Unblock</> : <><NoSymbolIcon className="w-3.5 h-3.5" />Block</>}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
