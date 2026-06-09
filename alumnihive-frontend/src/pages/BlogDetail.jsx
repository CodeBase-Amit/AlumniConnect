import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { blogsAPI } from '../services/api';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HeartIcon, ChatBubbleLeftIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/Avatar';
import CoverImage from '../components/CoverImage';

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

  if (loading) return <MainLayout><div className="text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-[3px] border-primary-600 border-t-transparent mx-auto"></div></div></MainLayout>;
  if (!blog) return <MainLayout><p className="text-center py-12 text-gray-400 text-sm">Blog not found</p></MainLayout>;

  const isAuthor = user && blog.author && user.id === blog.author._id;

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="badge-primary text-xs">{blog.category}</span>
            {isAuthor && (
              <div className="flex gap-2">
                <Link to={`/blogs/edit/${blog._id}`} className="btn-ghost text-xs p-1.5"><PencilIcon className="w-4 h-4" /></Link>
                <button onClick={handleDelete} className="btn-ghost text-xs p-1.5 text-red-500"><TrashIcon className="w-4 h-4" /></button>
              </div>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{blog.title}</h1>

          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Avatar name={blog.author?.name} className="w-10 h-10" />
              <div>
                <p className="font-medium text-gray-900 text-sm">{blog.author?.name}</p>
                <p className="text-xs text-gray-400">{blog.readTime || 5} min read • {formatDate(blog.publishedAt || blog.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-400 text-sm">
              <div className="flex items-center gap-1">
                <HeartIcon className="w-4 h-4" />
                <span>{blog.likes?.length || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <ChatBubbleLeftIcon className="w-4 h-4" />
                <span>{blog.comments?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <CoverImage type="blog" className="w-full h-64 rounded-xl" title={blog.title} />

        <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">{blog.content}</div>

        <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
          <button onClick={handleLike} className={`flex items-center gap-1.5 text-sm transition-colors ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'} cursor-pointer`}>
            {isLiked ? <HeartIconSolid className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
            <span>{blog.likes?.length || 0} Likes</span>
          </button>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <ChatBubbleLeftIcon className="w-5 h-5" />
            <span>{blog.comments?.length || 0} Comments</span>
          </div>
        </div>

        {blog.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {blog.tags.map((tag, idx) => (
              <span key={idx} className="badge-gray text-xs">#{tag}</span>
            ))}
          </div>
        )}

        <div className="space-y-5">
          <h2 className="text-lg font-bold text-gray-900">Comments ({blog.comments?.length || 0})</h2>

          {user ? (
            <form onSubmit={handleAddComment} className="card space-y-3">
              <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Share your thoughts..." className="input-field" rows={3} />
              <button type="submit" className="btn-primary">Post Comment</button>
            </form>
          ) : (
            <div className="bg-gray-50 rounded-xl p-5 text-center text-sm text-gray-500">
              Please <Link to="/login" className="text-link">login</Link> to comment
            </div>
          )}

          <div className="space-y-3">
            {blog.comments?.length > 0 ? (
              blog.comments.map((comment) => (
                <div key={comment._id} className="card">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar name={comment.user?.name} className="w-8 h-8 text-xs" />
                    <div>
                      <p className="font-medium text-sm text-gray-900">{comment.user?.name}</p>
                      <p className="text-xs text-gray-400">{formatDate(comment.createdAt)}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">{comment.content}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 text-sm py-4">No comments yet. Be the first!</p>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default BlogDetail;
