import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { blogsAPI } from '../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BookOpenIcon, PlusIcon, HeartIcon } from '@heroicons/react/24/outline';

const Blogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadBlogs();
  }, [search, category, page]);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      const res = await blogsAPI.getBlogs({
        search: search || undefined,
        category: category || undefined,
        page,
        limit: 12
      });
      setBlogs(res.data.blogs);
    } catch (error) {
      toast.error('Failed to load blogs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['technology', 'career', 'education', 'lifestyle', 'other'];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Blogs</h1>
            <p className="text-gray-600 mt-1">Read and share knowledge from the community</p>
          </div>
          <Link to="/blogs/create" className="btn-primary flex items-center space-x-2">
            <PlusIcon className="w-5 h-5" />
            <span>Write Blog</span>
          </Link>
        </div>

        {/* Search and Filter */}
        <div className="card space-y-4">
          <input
            type="text"
            placeholder="Search blogs..."
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

        {/* Blogs List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : blogs.length > 0 ? (
          <div className="space-y-4">
            {blogs.map(blog => (
              <Link
                to={`/blogs/${blog.slug}`}
                key={blog._id}
                className="card hover:shadow-lg transition"
              >
                <div className="flex gap-4">
                  <img
                    src={blog.coverImage || 'https://via.placeholder.com/150x150'}
                    alt={blog.title}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{blog.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{blog.excerpt}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <img
                            src={blog.author?.avatar}
                            alt={blog.author?.name}
                            className="w-6 h-6 rounded-full"
                          />
                          <span>{blog.author?.name}</span>
                        </div>
                        <span>• {blog.readTime} min read</span>
                        <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                          {blog.category}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <HeartIcon className="w-4 h-4" />
                        <span>{blog.likes?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12 text-gray-500">
            <BookOpenIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No blogs found</p>
          </div>
        )}

        {/* Pagination */}
        {blogs.length > 0 && (
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2">{page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              className="btn-secondary"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Blogs;