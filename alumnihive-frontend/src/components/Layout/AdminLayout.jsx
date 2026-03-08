import { useNavigate } from 'react-router-dom';
import { ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import AdminSidebar from './AdminSidebar';

const AdminLayout = ({ title, children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex">
      <AdminSidebar />

      <div className="flex-1">
        <header className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
            >
              <ArrowLeftOnRectangleIcon className="w-4 h-4" />
              Logout
            </button>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
