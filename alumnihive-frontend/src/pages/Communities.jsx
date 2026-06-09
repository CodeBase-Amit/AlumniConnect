import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { communitiesAPI } from '../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserGroupIcon, PlusIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import CoverImage from '../components/CoverImage';

const Communities = () => {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', description: '', category: 'technology', tags: '', isPrivate: false, requireApproval: false
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  useEffect(() => {
    loadCommunities();
  }, [search, category]);

  const loadCommunities = async () => {
    try {
      setLoading(true);
      const res = await communitiesAPI.getCommunities({ search: search || undefined, category: category || undefined, limit: 20 });
      setCommunities(res.data.communities);
    } catch (error) {
      toast.error('Failed to load communities');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([k, v]) => payload.append(k, String(v)));
      if (avatarFile) payload.append('avatar', avatarFile);

      await communitiesAPI.createCommunity(payload);
      toast.success('Community created successfully!');
      setShowCreateModal(false);
      setFormData({ name: '', description: '', category: 'technology', tags: '', isPrivate: false, requireApproval: false });
      setAvatarFile(null);
      setAvatarPreview('');
      loadCommunities();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create community');
    }
  };

  const categories = ['technology', 'career', 'hobby', 'academic', 'sports', 'arts', 'other'];

  return (
    <MainLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Communities</h1>
            <p className="text-gray-500 text-sm mt-0.5">Join communities to connect with like-minded people</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary shrink-0">
            <PlusIcon className="w-5 h-5" />
            <span>Create Community</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search communities..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="select-field sm:w-44">
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-primary-600 border-t-transparent mx-auto"></div>
          </div>
        ) : communities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {communities.map(c => (
              <Link to={`/communities/${c._id}`} key={c._id} className="card-hover group">
                <CoverImage type="community" className="w-full h-28 rounded-lg mb-3" title={c.name} />
                <h2 className="font-bold text-gray-900 mb-1">{c.name}</h2>
                <p className="text-gray-500 text-sm line-clamp-2 mb-3">{c.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <UserGroupIcon className="w-3.5 h-3.5" />
                    <span>{c.stats?.totalMembers || 0} members</span>
                  </div>
                  <span className="badge-primary text-[11px]">{c.category}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <UserGroupIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No communities found</p>
          </div>
        )}

        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold">Create Community</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer">
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleCreateCommunity} className="space-y-4">
                <div>
                  <label className="input-label">Community Name</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label className="input-label">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field" rows={3} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Category</label>
                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="select-field">
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="input-label">Tags</label>
                    <input type="text" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} className="input-field" placeholder="technology, jobs" />
                  </div>
                </div>
                <div>
                  <label className="input-label">Community Image</label>
                  <input type="file" accept="image/*" className="w-full text-sm" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setAvatarFile(file);
                    setAvatarPreview(URL.createObjectURL(file));
                  }} />
                  {avatarPreview && <CoverImage type="community" className="mt-2 h-24 w-full rounded-lg" title="Avatar preview" />}
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.isPrivate} onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })} className="rounded" />
                  <label className="text-sm text-gray-600">Private Community</label>
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="submit" className="btn-primary flex-1">Create</button>
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Communities;
