import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { blogsAPI } from '../services/api';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HeartIcon, ChatBubbleLeftIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { useAuth } from '../contexts/AuthContext';

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
      
      // Check if current user liked
      if (user && res.data.blog.likes) {
        setIsLiked(res.data.blog.likes.includes(user.id));
      }
    } catch (error) {
      toast.error('Failed to load blog');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like blogs');
      return;
    }
    
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
    
    if (!user) {
      toast.error('Please login to comment');
      return;
    }
    
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
    if (!window.confirm('Are you sure you want to delete this blog?')) return;
    
    try {
      await blogsAPI.deleteBlog(blog._id);
      toast.success('Blog deleted successfully!');
      navigate('/blogs');
    } catch (error) {
      toast.error('Failed to delete blog');
    }
  };

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

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
        </div>
      </MainLayout>
    );
  }

  if (!blog) {
    return (
      <MainLayout>
        <p className="text-center py-12 text-gray-500">Blog not found</p>
      </MainLayout>
    );
  }

  // ✅ CHECK IF CURRENT USER IS THE AUTHOR
  const isAuthor = user && blog.author && user.id === blog.author._id;

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <article className="space-y-6">
          {/* Header */}
          <div>
            {/* Category Badge & Edit/Delete Buttons */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full">
                {blog.category}
              </span>
              
              {/* ✅ EDIT & DELETE BUTTONS - Only show if user is author */}
              {isAuthor && (
                <div className="flex items-center space-x-3">
                  <Link
                    to={`/blogs/edit/${blog._id}`}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    <PencilIcon className="w-4 h-4" />
                    <span>Edit</span>
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                  >
                    <TrashIcon className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{blog.title}</h1>
            
            {/* Author Info */}
            <div className="flex items-center justify-between pb-6 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <img
                  src={blog.author?.avatar || 'https://via.placeholder.com/50'}
                  alt={blog.author?.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-medium text-gray-900">{blog.author?.name}</p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>{blog.readTime || 5} min read</span>
                    <span>•</span>
                    <span>{formatDate(blog.publishedAt || blog.createdAt)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-gray-600">
                <div className="flex items-center space-x-1">
                  <HeartIcon className="w-5 h-5" />
                  <span>{blog.likes?.length || 0}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ChatBubbleLeftIcon className="w-5 h-5" />
                  <span>{blog.comments?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cover Image */}
          {blog.coverImage && (
            <img
              src={blog.coverImage}
              alt={blog.title}
              className="w-full h-96 object-cover rounded-lg"
              onError={(e) => e.target.style.display = 'none'}
            />
          )}

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {blog.content}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 transition ${
                isLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
              }`}
            >
              {isLiked ? (
                <HeartIconSolid className="w-6 h-6" />
              ) : (
                <HeartIcon className="w-6 h-6" />
              )}
              <span>{blog.likes?.length || 0} Likes</span>
            </button>
            
            <div className="flex items-center space-x-2 text-gray-600">
              <ChatBubbleLeftIcon className="w-6 h-6" />
              <span>{blog.comments?.length || 0} Comments</span>
            </div>
          </div>

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {blog.tags.map((tag, index) => (
                <span
                  key={index}
                  className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </article>

        {/* Comments Section */}
        <div className="mt-12 space-y-6">
          <h2 className="text-2xl font-bold">
            Comments ({blog.comments?.length || 0})
          </h2>

          {/* Add Comment Form */}
          {user ? (
            <form onSubmit={handleAddComment} className="bg-white rounded-lg shadow-md p-6 space-y-4">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows="3"
              />
              <button
                type="submit"
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Post Comment
              </button>
            </form>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-gray-600">
                Please <Link to="/login" className="text-red-600 hover:text-red-700">login</Link> to comment
              </p>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {blog.comments && blog.comments.length > 0 ? (
              blog.comments.map((comment) => (
                <div key={comment._id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <img
                      src={comment.user?.avatar || 'https://via.placeholder.com/40'}
                      alt={comment.user?.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium">{comment.user?.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(comment.createdAt)}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-700">{comment.content}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-6">No comments yet. Be the first to comment!</p>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default BlogDetail;