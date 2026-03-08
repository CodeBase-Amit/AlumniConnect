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
      const res = await adminAPI.getUsers({ search: search || undefined, status: status || undefined });
      setUsers(res.data.users || []);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
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

  return (
    <AdminLayout title="User Management">
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
