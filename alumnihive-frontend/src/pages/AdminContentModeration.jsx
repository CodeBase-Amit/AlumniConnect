import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminLayout from '../components/Layout/AdminLayout';
import { adminAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/Avatar';
import { DocumentTextIcon, MagnifyingGlassIcon, FunnelIcon, ArrowPathIcon, NoSymbolIcon, FlagIcon, ExclamationTriangleIcon, CheckCircleIcon, UserIcon } from '@heroicons/react/24/outline';

const SkeletonTable = ({ rows = 4 }) => (
  <div className="divide-y divide-gray-100">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-28" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
        <div className="h-8 bg-gray-200 rounded animate-pulse w-36" />
      </div>
    ))}
  </div>
);

const AdminContentModeration = ({ type, title }) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') { navigate('/admin/login'); return; }
    loadItems();
  }, [user, authLoading, navigate, type, search, status]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getContent(type, { search: search || undefined, status: status || undefined });
      setItems(res.data.items || []);
    } catch (error) { toast.error('Failed to load content'); } finally { setLoading(false); }
  };

  const getOwner = (item) => {
    if (type === 'communities') return item.creator?.name || 'Unknown';
    return item.author?.name || 'Unknown';
  };

  const handleToggleBlock = async (item) => {
    try {
      await adminAPI.toggleContentBlock(type, item._id, !item.isBlocked, item.isBlocked ? 'Unblocked by admin' : 'Blocked by admin');
      toast.success(item.isBlocked ? 'Unblocked' : 'Blocked');
      loadItems();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  const handleToggleFeature = async (item) => {
    try {
      await adminAPI.toggleContentFeature(type, item._id, !item.isFeatured);
      toast.success(item.isFeatured ? 'Unfeatured' : 'Featured');
      loadItems();
    } catch (error) { toast.error('Failed to update'); }
  };

  const handleMark = async (item, tag) => {
    try { await adminAPI.markContent(type, item._id, tag, `Marked as ${tag}`); toast.success('Marked'); loadItems(); }
    catch (error) { toast.error('Failed to mark'); }
  };

  const getTagBadge = (tag) => {
    const styles = {
      spam: 'bg-red-50 text-red-700 ring-red-600/10',
      abuse: 'bg-orange-50 text-orange-700 ring-orange-600/10',
      duplicate: 'bg-blue-50 text-blue-700 ring-blue-600/10',
      other: 'bg-gray-50 text-gray-600 ring-gray-600/10',
      none: 'bg-gray-50 text-gray-400 ring-gray-300/10'
    };
    const s = styles[tag] || styles.none;
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ring-1 ${s}`}>{tag}</span>;
  };

  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <AdminLayout title={title}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-red-50 text-red-600">
            <DocumentTextIcon className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-semibold text-gray-900">All {typeLabel}</h2>
          {!loading && <span className="text-xs text-gray-400">({items.length} items)</span>}
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${type}...`} className="w-full border border-gray-300 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all" />
          </div>
          <div className="relative">
            <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border border-gray-300 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all appearance-none bg-white">
              <option value="">All statuses</option><option value="active">Active</option><option value="blocked">Blocked</option>
            </select>
          </div>
          <button onClick={loadItems} className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer">
            <ArrowPathIcon className="w-4 h-4" />Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider p-3">Title</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider p-3">Owner</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider p-3">State</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider p-3">Tag</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="p-4"><SkeletonTable rows={4} /></td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-sm text-gray-400">
                  <DocumentTextIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  No items found
                </td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-gray-50 text-gray-400 shrink-0">
                          <DocumentTextIcon className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-medium text-gray-900 truncate max-w-[200px] block">{item.title || item.name || 'Untitled'}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Avatar name={getOwner(item)} className="w-6 h-6 text-[10px] shrink-0" />
                        <span className="truncate max-w-[120px] block">{getOwner(item)}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-700">
                      <div className="flex items-center gap-1.5">
                        {item.isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 ring-1 ring-red-600/10">
                            <NoSymbolIcon className="w-3 h-3" />Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10">
                            <CheckCircleIcon className="w-3 h-3" />Active
                          </span>
                        )}
                        {item.isFeatured && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-600/10">
                            <FlagIcon className="w-3 h-3" />Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-700">{getTagBadge(item.moderationTag || 'none')}</td>
                    <td className="p-3 text-sm text-gray-700 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => handleToggleBlock(item)} className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                          item.isBlocked
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-1 ring-emerald-600/10'
                            : 'bg-red-50 text-red-700 hover:bg-red-100 ring-1 ring-red-600/10'
                        }`}>
                          {item.isBlocked ? <><CheckCircleIcon className="w-3.5 h-3.5" />Unblock</> : <><NoSymbolIcon className="w-3.5 h-3.5" />Block</>}
                        </button>
                        <button onClick={() => handleToggleFeature(item)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 ring-1 ring-blue-600/10 transition-colors cursor-pointer">
                          <FlagIcon className="w-3.5 h-3.5" />{item.isFeatured ? 'Unfeature' : 'Feature'}
                        </button>
                        <div className="relative">
                          <ExclamationTriangleIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                          <select value={item.moderationTag || 'none'} onChange={(e) => handleMark(item, e.target.value)} className="border border-gray-300 rounded-lg pl-7 pr-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all appearance-none cursor-pointer">
                            <option value="none">none</option><option value="spam">spam</option><option value="abuse">abuse</option><option value="duplicate">duplicate</option><option value="other">other</option>
                          </select>
                        </div>
                      </div>
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

export default AdminContentModeration;
