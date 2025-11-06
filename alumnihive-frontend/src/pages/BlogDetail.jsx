import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { blogsAPI } from '../services/api';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HeartIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

const BlogDetail = () => {
  const { slug } = useParams();
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
    } catch (error) {
      toast.error('Failed to load blog');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
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

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </MainLayout>
    );
  }

  if (!blog) {
    return <MainLayout><p className="text-center py-12 text-gray-500">Blog not found</p></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <article className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{blog.title}</h1>
            <div className="flex items-center justify-between text-gray-600 pb-4 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <img
                  src={blog.author?.avatar}
                  alt={blog.author?.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium">{blog.author?.name}</p>
                  <p className="text-sm text-gray-500">{blog.readTime} min read</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(blog.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Cover Image */}
          {blog.coverImage && (
            <img
              src={blog.coverImage}
              alt={blog.title}
              className="w-full h-96 object-cover rounded-lg"
            />
          )}

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{blog.content}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 ${isLiked ? 'text-red-600' : 'text-gray-600'} hover:text-red-600 transition`}
            >
              <HeartIcon className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
              <span>{blog.likes?.length || 0} Likes</span>
            </button>
            <div className="flex items-center space-x-2 text-gray-600">
              <ChatBubbleLeftIcon className="w-6 h-6" />
              <span>{blog.comments?.length || 0} Comments</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {blog.tags?.map(tag => (
              <span key={tag} className="text-xs bg-primary-100 text-primary-700 px-3 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        </article>

        {/* Comments Section */}
        <div className="mt-12 space-y-6">
          <h2 className="text-2xl font-bold">Comments ({blog.comments?.length || 0})</h2>

          {/* Add Comment */}
          <form onSubmit={handleAddComment} className="card space-y-4">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Share your thoughts..."
              className="input-field"
              rows="3"
            />
            <button type="submit" className="btn-primary">
              Post Comment
            </button>
          </form>

          {/* Comments List */}
          <div className="space-y-4">
            {blog.comments?.map(comment => (
              <div key={comment._id} className="card">
                <div className="flex items-center space-x-3 mb-3">
                  <img
                    src={comment.user?.avatar}
                    alt={comment.user?.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <p className="font-medium">{comment.user?.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700">{comment.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default BlogDetail;