import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminLayout from '../components/Layout/AdminLayout';
import { adminAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

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

  return (
    <AdminLayout title="Moderation Logs">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50"><tr>
            <th className="table-header">When</th><th className="table-header">Actor</th><th className="table-header">Target</th><th className="table-header">Action</th><th className="table-header">Reason</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td className="p-4 text-sm text-gray-400" colSpan={5}>Loading...</td></tr> : logs.length === 0 ? <tr><td className="p-4 text-sm text-gray-400" colSpan={5}>No logs found</td></tr> : (
              logs.map((log) => (
                <tr key={log._id} className="border-t border-gray-50">
                  <td className="table-cell text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="table-cell">{log.actor?.name || 'Admin'}</td>
                  <td className="table-cell capitalize">{log.targetType}</td>
                  <td className="table-cell uppercase text-xs font-medium">{log.action}</td>
                  <td className="table-cell text-gray-500">{log.reason || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default AdminModerationLogs;
