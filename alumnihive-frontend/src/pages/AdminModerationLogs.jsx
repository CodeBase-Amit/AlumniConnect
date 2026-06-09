import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminLayout from '../components/Layout/AdminLayout';
import { adminAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ClockIcon, ShieldCheckIcon, UserIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const SkeletonTable = ({ rows = 4 }) => (
  <div className="divide-y divide-gray-100">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-28" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
        <div className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
      </div>
    ))}
  </div>
);

const AdminModerationLogs = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') { navigate('/admin/login'); return; }
    loadLogs();
  }, [user, authLoading, navigate]);

  const loadLogs = async () => {
    try { setLoading(true); const res = await adminAPI.getModerationLogs({ limit: 100 }); setLogs(res.data.logs || []); }
    catch (error) { toast.error('Failed to load logs'); } finally { setLoading(false); }
  };

  const getActionBadge = (action) => {
    const styles = {
      blocked: 'bg-red-50 text-red-700 ring-red-600/10',
      unblocked: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
      approved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
      rejected: 'bg-red-50 text-red-700 ring-red-600/10',
      featured: 'bg-amber-50 text-amber-700 ring-amber-600/10',
      unfeatured: 'bg-gray-50 text-gray-600 ring-gray-600/10',
      marked: 'bg-blue-50 text-blue-700 ring-blue-600/10',
    };
    const s = styles[action?.toLowerCase()] || 'bg-gray-50 text-gray-600 ring-gray-600/10';
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium uppercase tracking-wider ring-1 ${s}`}>{action}</span>;
  };

  return (
    <AdminLayout title="Moderation Logs">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-50 text-red-600">
              <ShieldCheckIcon className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">Activity Log</h2>
            {!loading && <span className="text-xs text-gray-400">({logs.length} entries)</span>}
          </div>
          <button onClick={loadLogs} className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-1.5 transition-colors cursor-pointer">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider p-3"><div className="flex items-center gap-1.5"><ClockIcon className="w-3.5 h-3.5" />When</div></th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider p-3"><div className="flex items-center gap-1.5"><UserIcon className="w-3.5 h-3.5" />Actor</div></th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider p-3"><div className="flex items-center gap-1.5"><DocumentTextIcon className="w-3.5 h-3.5" />Target</div></th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider p-3">Action</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider p-3">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="p-4"><SkeletonTable rows={5} /></td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-sm text-gray-400">
                  <ShieldCheckIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  No logs found
                </td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 text-sm text-gray-500 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <ClockIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="text-xs">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm font-medium text-gray-900 whitespace-nowrap">{log.actor?.name || 'Admin'}</td>
                    <td className="p-3 text-sm text-gray-700 capitalize whitespace-nowrap">{log.targetType}</td>
                    <td className="p-3 text-sm text-gray-700 whitespace-nowrap">{getActionBadge(log.action)}</td>
                    <td className="p-3 text-sm text-gray-500 max-w-[200px] truncate">{log.reason || <span className="italic text-gray-300">-</span>}</td>
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

export default AdminModerationLogs;
