import { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { blogsAPI } from '../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import CoverImage from '../components/CoverImage';

const EditBlog = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: '', content: '', excerpt: '', coverImage: '', tags: '', category: 'technology', isPublished: false });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadBlog(); }, [id]);

  const loadBlog = async () => {
    try {
      setLoading(true);
      const res = await blogsAPI.getMyBlogs();
      const blog = res.data.blogs.find(b => b._id === id);
      if (!blog || blog.author._id !== user.id) {
        toast.error('Not authorized'); navigate('/blogs'); return;
      }
      setFormData({
        title: blog.title, content: blog.content, excerpt: blog.excerpt || '',
        coverImage: blog.coverImage || '', tags: blog.tags ? blog.tags.join(', ') : '',
        category: blog.category, isPublished: blog.isPublished
      });
    } catch (error) { toast.error('Failed to load blog'); navigate('/blogs'); } finally { setLoading(false); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e, publish = false) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) { toast.error('Title and content required'); return; }
    try {
      setSubmitting(true);
      const blogData = { ...formData, tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean), isPublished: publish };
      const res = await blogsAPI.updateBlog(id, blogData);
      toast.success(res.data.message);
      navigate(`/blogs/${res.data.blog.slug}`);
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to update'); } finally { setSubmitting(false); }
  };

  const categories = ['technology', 'career', 'education', 'lifestyle', 'other'];

  if (loading) return <MainLayout><div className="text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-[3px] border-primary-600 border-t-transparent mx-auto"></div></div></MainLayout>;

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Blog</h1>
          <p className="text-gray-500 text-sm mt-0.5">Update your blog content</p>
        </div>

        <form className="space-y-5">
          <div className="card">
            <label className="input-label">Title *</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} className="input-field text-lg" required />
          </div>

          <div className="card">
            <label className="input-label">Cover Image URL</label>
            <input type="url" name="coverImage" value={formData.coverImage} onChange={handleChange} placeholder="https://example.com/image.jpg" className="input-field" />
            {formData.coverImage && <CoverImage type="blog" className="mt-3 w-full h-40 rounded-lg" title="Cover preview" />}
          </div>

          <div className="card">
            <label className="input-label">Excerpt</label>
            <textarea name="excerpt" value={formData.excerpt} onChange={handleChange} className="input-field" rows={2} maxLength={300} />
            <p className="text-xs text-gray-400 mt-1">{formData.excerpt.length}/300</p>
          </div>

          <div className="card">
            <label className="input-label">Content *</label>
            <textarea name="content" value={formData.content} onChange={handleChange} className="input-field" rows={12} required />
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div className="card">
              <label className="input-label">Category *</label>
              <select name="category" value={formData.category} onChange={handleChange} className="select-field">
                {categories.map(cat => <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>)}
              </select>
            </div>
            <div className="card">
              <label className="input-label">Tags</label>
              <input type="text" name="tags" value={formData.tags} onChange={handleChange} placeholder="react, javascript" className="input-field" />
            </div>
          </div>

          <div className="bg-primary-50 border border-primary-100 rounded-xl p-3 text-xs text-primary-700">
            Status: <span className="font-semibold">{formData.isPublished ? 'Published' : 'Draft'}</span>
          </div>

          <div className="flex gap-4">
            <button type="button" onClick={(e) => handleSubmit(e, false)} disabled={submitting} className="btn-secondary flex-1 justify-center">{submitting ? 'Saving...' : 'Save as Draft'}</button>
            <button type="button" onClick={(e) => handleSubmit(e, true)} disabled={submitting} className="btn-primary flex-1 justify-center">{submitting ? 'Publishing...' : formData.isPublished ? 'Update & Publish' : 'Publish Blog'}</button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default EditBlog;
