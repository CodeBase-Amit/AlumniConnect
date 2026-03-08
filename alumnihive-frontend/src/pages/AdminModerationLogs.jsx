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
    if (authLoading) {
      return;
    }

    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }

    loadLogs();
  }, [user, authLoading, navigate]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getModerationLogs({ limit: 100 });
      setLogs(res.data.logs || []);
    } catch (error) {
      toast.error('Failed to load moderation logs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Moderation Logs">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 text-sm font-semibold">When</th>
              <th className="text-left p-3 text-sm font-semibold">Actor</th>
              <th className="text-left p-3 text-sm font-semibold">Target</th>
              <th className="text-left p-3 text-sm font-semibold">Action</th>
              <th className="text-left p-3 text-sm font-semibold">Reason</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-4 text-sm text-gray-500" colSpan={5}>Loading logs...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td className="p-4 text-sm text-gray-500" colSpan={5}>No moderation logs found</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} className="border-t border-gray-100">
                  <td className="p-3 text-xs text-gray-600">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="p-3 text-sm">{log.actor?.name || 'Admin'}</td>
                  <td className="p-3 text-sm capitalize">{log.targetType}</td>
                  <td className="p-3 text-sm uppercase">{log.action}</td>
                  <td className="p-3 text-sm text-gray-600">{log.reason || '-'}</td>
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
