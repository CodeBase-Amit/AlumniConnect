import { useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { blogsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import CoverImage from '../components/CoverImage';

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
      <div className="max-w-3xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Write a Blog</h1>
          <p className="text-gray-500 text-sm mt-0.5">Share your knowledge with the community</p>
        </div>

        <form className="space-y-5">
          <div className="card space-y-4">
            <div>
              <label className="input-label">Title *</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Enter blog title..." className="input-field text-lg" required />
            </div>

            <div className="space-y-3">
              <label className="input-label">Cover Image</label>
              <input type="file" accept="image/*" className="w-full text-sm" onChange={(e) => {
                const file = e.target.files?.[0]; if (!file) return;
                setCoverFile(file); setCoverPreview(URL.createObjectURL(file));
              }} />
              <p className="text-xs text-gray-400">Optional: or provide a URL</p>
              <input type="url" name="coverImage" value={formData.coverImage} onChange={handleChange} placeholder="https://example.com/image.jpg" className="input-field" />
              {(coverPreview || formData.coverImage) && (
                <CoverImage type="blog" className="w-full h-40 rounded-lg" title="Cover preview" />
              )}
            </div>

            <div>
              <label className="input-label">Excerpt</label>
              <textarea name="excerpt" value={formData.excerpt} onChange={handleChange} placeholder="Brief summary..." className="input-field" rows={2} maxLength={300} />
              <p className="text-xs text-gray-400 mt-1">{formData.excerpt.length}/300</p>
            </div>
          </div>

          <div className="card">
            <label className="input-label">Content *</label>
            <textarea name="content" value={formData.content} onChange={handleChange} placeholder="Write your blog content here..." className="input-field" rows={12} required />
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

          <div className="flex gap-4">
            <button type="button" onClick={(e) => handleSubmit(e, false)} disabled={loading} className="btn-secondary flex-1 justify-center">{loading ? 'Saving...' : 'Save as Draft'}</button>
            <button type="button" onClick={(e) => handleSubmit(e, true)} disabled={loading} className="btn-primary flex-1 justify-center">{loading ? 'Publishing...' : 'Publish Blog'}</button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default CreateBlog;
