import { useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { questionsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AskQuestion = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: '', content: '', category: 'technical', tags: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) { toast.error('Title and content are required'); return; }
    try {
      setLoading(true);
      const questionData = { ...formData, tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean) };
      const res = await questionsAPI.createQuestion(questionData);
      toast.success(res.data.message);
      navigate(`/questions/${res.data.question.slug}`);
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to post question'); } finally { setLoading(false); }
  };

  const categories = ['technical', 'career', 'academic', 'general', 'other'];

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ask a Question</h1>
          <p className="text-gray-500 text-sm mt-0.5">Get help from the community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="card">
            <label className="input-label">Question Title *</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="What's your question? Be specific." className="input-field text-lg" required />
            <p className="text-xs text-gray-400 mt-2">Make your question clear and concise</p>
          </div>

          <div className="card">
            <label className="input-label">Details *</label>
            <textarea name="content" value={formData.content} onChange={handleChange} placeholder="Provide more details..." className="input-field" rows={8} required />
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
              <input type="text" name="tags" value={formData.tags} onChange={handleChange} placeholder="javascript, react" className="input-field" />
              <p className="text-xs text-gray-400 mt-2">Add up to 5 comma-separated tags</p>
            </div>
          </div>

          <div className="flex gap-4">
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">{loading ? 'Posting...' : 'Post Question'}</button>
            <button type="button" onClick={() => navigate('/questions')} disabled={loading} className="btn-secondary flex-1 justify-center">Cancel</button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default AskQuestion;
