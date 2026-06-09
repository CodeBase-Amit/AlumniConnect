import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { communitiesAPI } from '../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  UsersIcon,
  ChevronDownIcon,
  HashtagIcon,
  LockClosedIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import CoverImage from '../components/CoverImage';
import Avatar from '../components/Avatar';

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

  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
      <div className="h-28 bg-gradient-to-br from-gray-200 to-gray-300" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
          <div className="h-4 bg-gray-200 rounded-full w-3/4" />
        </div>
        <div className="space-y-2 pl-[52px]">
          <div className="h-3 bg-gray-100 rounded-full w-full" />
          <div className="h-3 bg-gray-100 rounded-full w-2/3" />
        </div>
        <div className="flex items-center justify-between pt-2 pl-[52px]">
          <div className="h-3 bg-gray-100 rounded-full w-24" />
          <div className="h-5 bg-gray-100 rounded-full w-16" />
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="relative pb-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-1 h-6 bg-gradient-to-b from-violet-500 to-purple-600 rounded-full" />
                <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Communities</h1>
              </div>
              <p className="text-gray-500 text-sm ml-3.5">Join communities to connect with like-minded people</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium text-sm rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-violet-200 shrink-0"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Create Community</span>
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-violet-200 via-purple-200 to-transparent" />
        </div>

        {/* Search / Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search communities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all duration-200"
            />
          </div>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="appearance-none w-full sm:w-44 pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all duration-200 cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : communities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {communities.map(c => (
              <Link
                to={`/communities/${c._id}`}
                key={c._id}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 overflow-hidden"
              >
                <div className="relative overflow-hidden">
                  <CoverImage type="community" className="w-full h-28 rounded-t-2xl rounded-b-none transition-transform duration-300 group-hover:scale-105" title={c.name} />
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-gray-700 text-[11px] font-medium rounded-full shadow-sm">
                      <HashtagIcon className="w-3 h-3" />
                      {c.category}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar name={c.name} className="w-10 h-10 text-xs shrink-0 ring-2 ring-white shadow-sm" />
                    <div className="min-w-0 flex-1">
                      <h2 className="font-bold text-gray-900 text-base truncate group-hover:text-violet-600 transition-colors">{c.name}</h2>
                      <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mt-0.5">{c.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <UserGroupIcon className="w-3.5 h-3.5" />
                      <span className="font-medium">{c.stats?.totalMembers || 0} members</span>
                    </div>
                    {c.isPrivate && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        <LockClosedIcon className="w-3 h-3" />
                        Private
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 px-6 text-center">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UsersIcon className="w-7 h-7 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No communities found</h3>
            <p className="text-sm text-gray-400 mb-5 max-w-xs mx-auto">Try adjusting your search or filter to find what you're looking for.</p>
            {search || category ? (
              <button
                onClick={() => { setSearch(''); setCategory(''); }}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
                Clear filters
              </button>
            ) : (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-50 text-violet-700 text-sm font-medium rounded-xl hover:bg-violet-100 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Create the first community
              </button>
            )}
          </div>
        )}

        {/* Create Community Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-1 h-5 bg-gradient-to-b from-violet-500 to-purple-600 rounded-full" />
                  <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Create Community</h2>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                  <XMarkIcon className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleCreateCommunity} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Community Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all duration-200"
                    placeholder="e.g. AI Enthusiasts"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all duration-200 resize-none"
                    rows={3}
                    placeholder="What is this community about?"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                    <div className="relative">
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="appearance-none w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all duration-200 cursor-pointer"
                      >
                        {categories.map(cat => <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>)}
                      </select>
                      <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags</label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all duration-200"
                      placeholder="technology, jobs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Community Image</label>
                  <div
                    className="border border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-violet-300 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                  >
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setAvatarFile(file);
                        setAvatarPreview(URL.createObjectURL(file));
                      }}
                    />
                    {avatarPreview ? (
                      <CoverImage type="community" className="h-24 w-full rounded-lg" title="Avatar preview" />
                    ) : (
                      <div className="text-gray-400 text-sm">
                        <PlusIcon className="w-6 h-6 mx-auto mb-1" />
                        <span>Click to upload an image</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPrivate}
                      onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600" />
                  </label>
                  <div className="flex items-center gap-1.5">
                    {formData.isPrivate ? <LockClosedIcon className="w-4 h-4 text-amber-500" /> : <GlobeAltIcon className="w-4 h-4 text-gray-400" />}
                    <span className="text-sm text-gray-600">Private Community</span>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium text-sm rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-violet-200">
                    Create Community
                  </button>
                  <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium text-sm rounded-xl hover:bg-gray-50 transition-all duration-200">
                    Cancel
                  </button>
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
