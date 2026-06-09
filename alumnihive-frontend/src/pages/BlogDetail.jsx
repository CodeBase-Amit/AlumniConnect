import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { blogsAPI } from '../services/api';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HeartIcon, ChatBubbleLeftIcon, PencilIcon, TrashIcon, BookOpenIcon, CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/Avatar';
import CoverImage from '../components/CoverImage';

const Skeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-72 w-full bg-gray-200 rounded-2xl" />
    <div className="space-y-3">
      <div className="h-4 w-20 bg-gray-200 rounded-full" />
      <div className="h-10 w-3/4 bg-gray-200 rounded-lg" />
      <div className="flex items-center gap-3 mt-4">
        <div className="h-10 w-10 bg-gray-200 rounded-full" />
        <div className="space-y-2">
          <div className="h-3 w-28 bg-gray-200 rounded" />
          <div className="h-3 w-40 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-4 w-full bg-gray-200 rounded" />
      <div className="h-4 w-5/6 bg-gray-200 rounded" />
      <div className="h-4 w-4/6 bg-gray-200 rounded" />
      <div className="h-4 w-full bg-gray-200 rounded" />
      <div className="h-4 w-3/4 bg-gray-200 rounded" />
    </div>
  </div>
);

const BlogDetail = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    loadBlog();
  }, [slug]);

  const loadBlog = async () => {
    try {
      setLoading(true);
      const res = await blogsAPI.getBlogBySlug(slug);
      setBlog(res.data.blog);
      if (user && res.data.blog.likes) {
        setIsLiked(res.data.blog.likes.includes(user.id));
      }
    } catch (error) {
      toast.error('Failed to load blog');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) { toast.error('Please login to like blogs'); return; }
    try {
      await blogsAPI.likeBlog(blog._id);
      setIsLiked(!isLiked);
      loadBlog();
    } catch (error) {
      toast.error('Failed to like blog');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to comment'); return; }
    if (!commentText.trim()) return;
    try {
      await blogsAPI.addComment(blog._id, { content: commentText });
      toast.success('Comment added!');
      setCommentText('');
      loadBlog();
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this blog?')) return;
    try {
      await blogsAPI.deleteBlog(blog._id);
      toast.success('Blog deleted!');
      navigate('/blogs');
    } catch (error) {
      toast.error('Failed to delete blog');
    }
  };

  const formatDate = (date) => {
    const diffDays = Math.floor(Math.abs(new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  if (loading) return <MainLayout><div className="max-w-4xl mx-auto px-4 py-8"><Skeleton /></div></MainLayout>;
  if (!blog) return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <BookOpenIcon className="w-16 h-16 mx-auto text-gray-300" />
        <p className="mt-4 text-gray-500 text-lg">Blog not found</p>
        <Link to="/blogs" className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium">Browse all blogs</Link>
      </div>
    </MainLayout>
  );

  const isAuthor = user && blog.author && user.id === blog.author._id;

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="relative">
            <div className="h-72 sm:h-80 w-full">
              <CoverImage type="blog" className="w-full h-full object-cover" title={blog.title} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              <Link
                to={`/blogs?category=${encodeURIComponent(blog.category)}`}
                className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full hover:bg-white/30 transition-colors"
              >
                {blog.category}
              </Link>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar name={blog.author?.name} className="w-12 h-12 ring-2 ring-gray-100" />
                <div>
                  <p className="font-semibold text-gray-900">{blog.author?.name}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <ClockIcon className="w-3.5 h-3.5" />
                      {blog.readTime || 5} min read
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDaysIcon className="w-3.5 h-3.5" />
                      {formatDate(blog.publishedAt || blog.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              {isAuthor && (
                <div className="flex gap-2">
                  <Link
                    to={`/blogs/edit/${blog._id}`}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">{blog.title}</h1>

            <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed text-base sm:text-lg whitespace-pre-wrap">
              {blog.content}
            </div>

            {blog.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {blog.tags.map((tag, idx) => (
                  <Link
                    key={idx}
                    to={`/blogs?tag=${encodeURIComponent(tag)}`}
                    className="px-3 py-1.5 bg-gray-50 text-gray-600 text-xs font-medium rounded-full hover:bg-gray-100 hover:text-gray-800 transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isLiked ? 'text-red-500 scale-105' : 'text-gray-500 hover:text-red-500'
                }`}
              >
                <span className={`transition-transform duration-200 ${isLiked ? 'scale-110' : ''}`}>
                  {isLiked ? <HeartIconSolid className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
                </span>
                <span>{blog.likes?.length || 0} {blog.likes?.length === 1 ? 'Like' : 'Likes'}</span>
              </button>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <ChatBubbleLeftIcon className="w-5 h-5" />
                <span>{blog.comments?.length || 0} {blog.comments?.length === 1 ? 'Comment' : 'Comments'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Comments {blog.comments?.length > 0 && <span className="text-gray-400 font-normal">({blog.comments.length})</span>}
          </h2>

          {user ? (
            <form onSubmit={handleAddComment} className="bg-gray-50 rounded-xl p-4 sm:p-5 space-y-4">
              <div className="flex items-start gap-3">
                <Avatar name={user.name} className="w-9 h-9 flex-shrink-0" />
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none transition-shadow"
                  rows={3}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Post Comment
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <ChatBubbleLeftIcon className="w-10 h-10 mx-auto text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">
                Please <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">login</Link> to join the discussion
              </p>
            </div>
          )}

          <div className="mt-6 space-y-4">
            {blog.comments?.length > 0 ? (
              blog.comments.map((comment) => (
                <div key={comment._id} className="bg-white border border-gray-100 rounded-xl p-4 sm:p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar name={comment.user?.name} className="w-9 h-9 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{comment.user?.name || 'Anonymous'}</p>
                      <p className="text-xs text-gray-400">{formatDate(comment.createdAt)}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{comment.content}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <ChatBubbleLeftIcon className="w-12 h-12 mx-auto text-gray-200" />
                <p className="mt-3 text-gray-400 text-sm">No comments yet. Be the first to share your thoughts!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default BlogDetail;
