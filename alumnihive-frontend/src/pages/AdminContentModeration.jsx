import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminLayout from '../components/Layout/AdminLayout';
import { adminAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const AdminContentModeration = ({ type, title }) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
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

    loadItems();
  }, [user, authLoading, navigate, type, search, status]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getContent(type, {
        search: search || undefined,
        status: status || undefined
      });
      setItems(res.data.items || []);
    } catch (error) {
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const getOwner = (item) => {
    if (type === 'communities') {
      return item.creator?.name || 'Unknown';
    }
    return item.author?.name || 'Unknown';
  };

  const handleToggleBlock = async (item) => {
    try {
      await adminAPI.toggleContentBlock(type, item._id, !item.isBlocked, item.isBlocked ? 'Unblocked by admin' : 'Blocked by admin');
      toast.success(item.isBlocked ? 'Item unblocked' : 'Item blocked');
      loadItems();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update block state');
    }
  };

  const handleToggleFeature = async (item) => {
    try {
      await adminAPI.toggleContentFeature(type, item._id, !item.isFeatured);
      toast.success(item.isFeatured ? 'Feature removed' : 'Item featured');
      loadItems();
    } catch (error) {
      toast.error('Failed to update featured state');
    }
  };

  const handleMark = async (item, tag) => {
    try {
      await adminAPI.markContent(type, item._id, tag, `Marked as ${tag}`);
      toast.success('Item marked');
      loadItems();
    } catch (error) {
      toast.error('Failed to mark item');
    }
  };

  return (
    <AdminLayout title={title}>
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <div className="grid md:grid-cols-3 gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${type}`}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
          <button onClick={loadItems} className="bg-gray-900 text-white rounded-lg px-4 py-2">
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 text-sm font-semibold">Title</th>
              <th className="text-left p-3 text-sm font-semibold">Owner</th>
              <th className="text-left p-3 text-sm font-semibold">State</th>
              <th className="text-left p-3 text-sm font-semibold">Tag</th>
              <th className="text-right p-3 text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-4 text-sm text-gray-500" colSpan={5}>Loading...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="p-4 text-sm text-gray-500" colSpan={5}>No items found</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item._id} className="border-t border-gray-100">
                  <td className="p-3 text-sm">{item.title || item.name || 'Untitled'}</td>
                  <td className="p-3 text-sm">{getOwner(item)}</td>
                  <td className="p-3 text-sm">
                    {item.isBlocked ? 'Blocked' : 'Active'}
                    {item.isFeatured ? ' • Featured' : ''}
                  </td>
                  <td className="p-3 text-sm capitalize">{item.moderationTag || 'none'}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleBlock(item)}
                        className={`rounded-lg px-3 py-1 text-xs ${
                          item.isBlocked ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {item.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                      <button
                        onClick={() => handleToggleFeature(item)}
                        className="rounded-lg px-3 py-1 text-xs bg-blue-100 text-blue-700"
                      >
                        {item.isFeatured ? 'Unfeature' : 'Feature'}
                      </button>
                      <select
                        value={item.moderationTag || 'none'}
                        onChange={(e) => handleMark(item, e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 py-1 text-xs"
                      >
                        <option value="none">none</option>
                        <option value="spam">spam</option>
                        <option value="abuse">abuse</option>
                        <option value="duplicate">duplicate</option>
                        <option value="other">other</option>
                      </select>
                    </div>
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

export default AdminContentModeration;
