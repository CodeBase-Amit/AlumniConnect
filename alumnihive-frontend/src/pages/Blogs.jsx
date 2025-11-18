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
  const [totalPages, setTotalPages] = useState(1);

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
      setTotalPages(res.data.totalPages);
    } catch (error) {
      toast.error('Failed to load blogs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'technology', 'career', 'education', 'lifestyle', 'other'];

  const formatDate = (date) => {
    const now = new Date();
    const blogDate = new Date(date);
    const diffTime = Math.abs(now - blogDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📚 Blogs</h1>
            <p className="text-gray-600 mt-1">Read and share knowledge from the community</p>
          </div>
          <Link 
            to="/blogs/create" 
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition flex items-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Write Blog</span>
          </Link>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <input
            type="text"
            placeholder="Search blogs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat === 'all' ? '' : cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Blogs Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          </div>
        ) : blogs.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog) => (
                <Link
                  to={`/blogs/${blog.slug}`}
                  key={blog._id}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition overflow-hidden"
                >
                  <img
                    src={blog.coverImage || 'https://via.placeholder.com/400x200'}
                    alt={blog.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                        {blog.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {blog.readTime || 5} min read
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                      {blog.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {blog.excerpt || blog.content.substring(0, 100) + '...'}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <img
                          src={blog.author?.avatar || 'https://via.placeholder.com/40'}
                          alt={blog.author?.name}
                          className="w-6 h-6 rounded-full"
                        />
                        <span>{blog.author?.name}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <HeartIcon className="w-4 h-4" />
                        <span>{blog.likes?.length || 0}</span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-400 mt-2">
                      {formatDate(blog.publishedAt || blog.createdAt)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md text-center py-12 text-gray-500">
            <BookOpenIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No blogs found</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Blogs;