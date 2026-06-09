import { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { blogsAPI } from '../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import CoverImage from '../components/CoverImage';
import { PencilSquareIcon, PhotoIcon, TagIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

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

  if (loading) return (
    <MainLayout>
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-primary-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-400">Loading blog...</p>
        </div>
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-200">
              <PencilSquareIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Blog</h1>
              <p className="text-gray-500 text-sm">Update your blog content</p>
            </div>
          </div>
          <div className="h-1 w-20 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full mt-3"></div>
        </div>

        <form className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title *</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-gray-900 placeholder-gray-400 text-lg" required />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cover Image URL</label>
            <div className="relative">
              <input type="url" name="coverImage" value={formData.coverImage} onChange={handleChange} placeholder="https://example.com/image.jpg" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-gray-900 placeholder-gray-400 pl-10" />
              <PhotoIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            {formData.coverImage && (
              <div className="mt-3">
                <CoverImage type="blog" className="w-full h-44 rounded-xl object-cover shadow-sm" title="Cover preview" />
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Excerpt</label>
            <textarea name="excerpt" value={formData.excerpt} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-gray-900 placeholder-gray-400 resize-none" rows={2} maxLength={300} />
            <div className="flex justify-end mt-1">
              <span className="text-xs text-gray-400">{formData.excerpt.length}/300</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Content *</label>
            <textarea name="content" value={formData.content} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-gray-900 placeholder-gray-400 resize-none" rows={12} required />
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category *</label>
              <div className="relative">
                <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-gray-900 appearance-none cursor-pointer">
                  {categories.map(cat => <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>)}
                </select>
                <svg className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tags</label>
              <div className="relative">
                <input type="text" name="tags" value={formData.tags} onChange={handleChange} placeholder="react, javascript" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-gray-900 placeholder-gray-400 pl-10" />
                <TagIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-4 rounded-xl bg-gradient-to-r from-primary-50 to-primary-50/50 border border-primary-100">
            <InformationCircleIcon className="w-5 h-5 text-primary-600 flex-shrink-0" />
            <p className="text-sm text-primary-700">
              Status: <span className="font-semibold">{formData.isPublished ? 'Published' : 'Draft'}</span>
            </p>
          </div>

          <div className="flex gap-4">
            <button type="button" onClick={(e) => handleSubmit(e, false)} disabled={submitting} className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
              {submitting ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving...</>
              ) : 'Save as Draft'}
            </button>
            <button type="button" onClick={(e) => handleSubmit(e, true)} disabled={submitting} className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold text-sm shadow-lg shadow-primary-200 hover:shadow-xl hover:shadow-primary-300 hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
              {submitting ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Publishing...</>
              ) : formData.isPublished ? 'Update & Publish' : 'Publish Blog'}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default EditBlog;
