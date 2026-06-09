import { useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { blogsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import CoverImage from '../components/CoverImage';
import { PencilSquareIcon, PhotoIcon, TagIcon } from '@heroicons/react/24/outline';

const CreateBlog = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: '', content: '', excerpt: '', coverImage: '', tags: '', category: 'technology' });
  const [loading, setLoading] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e, publish = false) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) { toast.error('Title and content are required'); return; }
    try {
      setLoading(true);
      const blogData = new FormData();
      blogData.append('title', formData.title);
      blogData.append('content', formData.content);
      blogData.append('excerpt', formData.excerpt);
      blogData.append('category', formData.category);
      blogData.append('tags', formData.tags);
      blogData.append('isPublished', String(publish));
      if (coverFile) blogData.append('coverImage', coverFile);
      else if (formData.coverImage) blogData.append('coverImage', formData.coverImage);

      const res = await blogsAPI.createBlog(blogData);
      toast.success(res.data.message);
      navigate(`/blogs/${res.data.blog.slug}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create blog');
    } finally { setLoading(false); }
  };

  const categories = ['technology', 'career', 'education', 'lifestyle', 'other'];

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-200">
              <PencilSquareIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Write a Blog</h1>
              <p className="text-gray-500 text-sm">Share your knowledge with the community</p>
            </div>
          </div>
          <div className="h-1 w-20 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full mt-3"></div>
        </div>

        <form className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title *</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Enter blog title..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-gray-900 placeholder-gray-400 text-lg" required />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cover Image</label>
              <div className="relative">
                <input type="file" accept="image/*" className="hidden" id="blog-cover-upload" onChange={(e) => {
                  const file = e.target.files?.[0]; if (!file) return;
                  setCoverFile(file); setCoverPreview(URL.createObjectURL(file));
                }} />
                <label htmlFor="blog-cover-upload" className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary-400 hover:bg-primary-50/30 cursor-pointer transition-all">
                  <PhotoIcon className="w-8 h-8 text-gray-300 mb-1" />
                  <span className="text-sm text-gray-400 font-medium">Click to upload cover image</span>
                  <span className="text-xs text-gray-300 mt-0.5">PNG, JPG, WEBP</span>
                </label>
              </div>
              <p className="text-xs text-gray-400 mt-2">Optional: or provide a URL</p>
              <div className="mt-2 relative">
                <input type="url" name="coverImage" value={formData.coverImage} onChange={handleChange} placeholder="https://example.com/image.jpg" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-gray-900 placeholder-gray-400 pl-10" />
                <PhotoIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              {(coverPreview || formData.coverImage) && (
                <div className="mt-3">
                  <CoverImage type="blog" className="w-full h-44 rounded-xl object-cover shadow-sm" title="Cover preview" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Excerpt</label>
              <textarea name="excerpt" value={formData.excerpt} onChange={handleChange} placeholder="Brief summary of your blog..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-gray-900 placeholder-gray-400 resize-none" rows={2} maxLength={300} />
              <div className="flex justify-end mt-1">
                <span className="text-xs text-gray-400">{formData.excerpt.length}/300</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Content *</label>
            <textarea name="content" value={formData.content} onChange={handleChange} placeholder="Write your blog content here..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-gray-900 placeholder-gray-400 resize-none" rows={12} required />
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

          <div className="flex gap-4">
            <button type="button" onClick={(e) => handleSubmit(e, false)} disabled={loading} className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
              {loading ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving...</>
              ) : 'Save as Draft'}
            </button>
            <button type="button" onClick={(e) => handleSubmit(e, true)} disabled={loading} className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold text-sm shadow-lg shadow-primary-200 hover:shadow-xl hover:shadow-primary-300 hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
              {loading ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Publishing...</>
              ) : 'Publish Blog'}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default CreateBlog;
