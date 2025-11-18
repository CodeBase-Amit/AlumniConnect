import { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { blogsAPI } from '../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const EditBlog = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    coverImage: '',
    tags: '',
    category: 'technology',
    isPublished: false
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadBlog();
  }, [id]);

  const loadBlog = async () => {
    try {
      setLoading(true);
      // Get user's blogs and find the one to edit
      const res = await blogsAPI.getMyBlogs();
      const blog = res.data.blogs.find(b => b._id === id);
      
      if (!blog) {
        toast.error('Blog not found or you are not authorized to edit it');
        navigate('/blogs');
        return;
      }
      
      // Check if current user is the author
      if (blog.author._id !== user.id) {
        toast.error('You are not authorized to edit this blog');
        navigate('/blogs');
        return;
      }
      
      setFormData({
        title: blog.title,
        content: blog.content,
        excerpt: blog.excerpt || '',
        coverImage: blog.coverImage || '',
        tags: blog.tags ? blog.tags.join(', ') : '',
        category: blog.category,
        isPublished: blog.isPublished
      });
    } catch (error) {
      toast.error('Failed to load blog');
      console.error(error);
      navigate('/blogs');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e, publish = false) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const blogData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        isPublished: publish
      };
      
      const res = await blogsAPI.updateBlog(id, blogData);
      toast.success(res.data.message);
      navigate(`/blogs/${res.data.blog.slug}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update blog');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const categories = ['technology', 'career', 'education', 'lifestyle', 'other'];

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading blog...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">✏️ Edit Blog</h1>
          <p className="text-gray-600 mt-1">Update your blog content</p>
        </div>

        <form className="space-y-6">
          {/* Title */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter blog title..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg"
              required
            />
          </div>

          {/* Cover Image */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Image URL
            </label>
            <input
              type="url"
              name="coverImage"
              value={formData.coverImage}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            {formData.coverImage && (
              <img
                src={formData.coverImage}
                alt="Preview"
                className="mt-4 w-full h-48 object-cover rounded-lg"
                onError={(e) => e.target.style.display = 'none'}
              />
            )}
          </div>

          {/* Excerpt */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Excerpt (Short description)
            </label>
            <textarea
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              placeholder="Brief summary of your blog..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows="2"
              maxLength="300"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.excerpt.length}/300 characters
            </p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Write your blog content here..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows="15"
              required
            />
          </div>

          {/* Category and Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="react, javascript, web development"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Current Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              Current Status: <span className="font-semibold">
                {formData.isPublished ? '✅ Published' : '📝 Draft'}
              </span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, false)}
              disabled={submitting}
              className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : 'Save as Draft'}
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={submitting}
              className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Publishing...' : formData.isPublished ? 'Update & Publish' : 'Publish Blog'}
            </button>
          </div>

          {/* Cancel Button */}
          <button
            type="button"
            onClick={() => navigate('/blogs')}
            className="w-full bg-white text-gray-700 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </form>
      </div>
    </MainLayout>
  );
};

export default EditBlog;