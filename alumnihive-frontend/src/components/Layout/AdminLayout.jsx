import AdminSidebar from './AdminSidebar';

const AdminLayout = ({ title, children }) => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 border-b border-gray-200 bg-white/90 backdrop-blur-md px-6 flex items-center sticky top-0 z-40">
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
