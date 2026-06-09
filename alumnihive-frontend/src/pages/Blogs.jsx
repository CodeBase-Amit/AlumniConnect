import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { blogsAPI } from '../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BookOpenIcon, PlusIcon, HeartIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Avatar from '../components/Avatar';
import CoverImage from '../components/CoverImage';

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
      const res = await blogsAPI.getBlogs({ search: search || undefined, category: category || undefined, page, limit: 12 });
      setBlogs(res.data.blogs);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      toast.error('Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'technology', 'career', 'education', 'lifestyle', 'other'];

  const formatDate = (date) => {
    const diffDays = Math.floor(Math.abs(new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <MainLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Blogs</h1>
            <p className="text-gray-500 text-sm mt-0.5">Read and share knowledge from the community</p>
          </div>
          <Link to="/blogs/create" className="btn-primary shrink-0">
            <PlusIcon className="w-5 h-5" />
            <span>Write Blog</span>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search blogs..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="select-field sm:w-44">
            {categories.map((cat) => (
              <option key={cat} value={cat === 'all' ? '' : cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-primary-600 border-t-transparent mx-auto"></div>
          </div>
        ) : blogs.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {blogs.map((blog) => (
                <Link to={`/blogs/${blog.slug}`} key={blog._id} className="card-hover overflow-hidden group">
                  <CoverImage type="blog" className="w-full h-40 rounded-lg mb-4" title={blog.title} />
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge-primary text-[11px]">{blog.category}</span>
                    <span className="text-[11px] text-gray-400">{blog.readTime || 5} min read</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1.5 line-clamp-2">{blog.title}</h3>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-3">{blog.excerpt || blog.content?.substring(0, 100) + '...'}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar name={blog.author?.name} className="w-5 h-5 text-[10px]" />
                      <span className="text-xs text-gray-500">{blog.author?.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <HeartIcon className="w-3.5 h-3.5" />
                      <span>{blog.likes?.length || 0}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2">{formatDate(blog.publishedAt || blog.createdAt)}</p>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost text-sm">
                  Previous
                </button>
                <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-ghost text-sm">
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <BookOpenIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No blogs found</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Blogs;
