import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { communitiesAPI } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { UserGroupIcon, PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Communities = () => {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'technology',
    isPrivate: false,
    requireApproval: false
  });

  useEffect(() => {
    loadCommunities();
  }, [search, category]);

  const loadCommunities = async () => {
    try {
      setLoading(true);
      const res = await communitiesAPI.getCommunities({
        search: search || undefined,
        category: category || undefined,
        limit: 20
      });
      setCommunities(res.data.communities);
    } catch (error) {
      toast.error('Failed to load communities');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    try {
      const res = await communitiesAPI.createCommunity(formData);
      toast.success('Community created successfully!');
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        category: 'technology',
        isPrivate: false,
        requireApproval: false
      });
      loadCommunities();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create community');
    }
  };

  const categories = ['technology', 'career', 'hobby', 'academic', 'sports', 'arts', 'other'];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Communities</h1>
            <p className="text-gray-600 mt-1">Join communities to connect with like-minded people</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Create Community</span>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="card space-y-4">
          <input
            type="text"
            placeholder="Search communities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-field"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Communities Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : communities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map(c => (
              <Link
                to={`/communities/${c._id}`}
                key={c._id}
                className="card hover:shadow-lg transition cursor-pointer"
              >
                <img
                  src={c.avatar}
                  alt={c.name}
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
                <h2 className="font-bold text-xl text-gray-900 mb-2">{c.name}</h2>
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">{c.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <UserGroupIcon className="w-4 h-4" />
                    <span>{c.stats?.totalMembers || 0} members</span>
                  </div>
                  <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                    {c.category}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12 text-gray-500">
            <UserGroupIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No communities found</p>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-6">Create Community</h2>
              <form onSubmit={handleCreateCommunity} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Community Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field"
                    rows="3"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isPrivate}
                    onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                  />
                  <label className="text-sm">Private Community</label>
                </div>
                <div className="flex space-x-3">
                  <button type="submit" className="btn-primary flex-1">Create</button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary flex-1"
                  >
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