import { useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { questionsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { QuestionMarkCircleIcon, TagIcon } from '@heroicons/react/24/outline';

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
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-200">
              <QuestionMarkCircleIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ask a Question</h1>
              <p className="text-gray-500 text-sm">Get help from the community</p>
            </div>
          </div>
          <div className="h-1 w-20 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full mt-3"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Question Title *</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="What's your question? Be specific." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-gray-900 placeholder-gray-400 text-lg" required />
            <p className="text-xs text-gray-400 mt-2">Make your question clear and concise</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Details *</label>
            <textarea name="content" value={formData.content} onChange={handleChange} placeholder="Provide more details about your question..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-gray-900 placeholder-gray-400 resize-none" rows={8} required />
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
                <input type="text" name="tags" value={formData.tags} onChange={handleChange} placeholder="javascript, react" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-gray-900 placeholder-gray-400 pl-10" />
                <TagIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-xs text-gray-400 mt-2">Add up to 5 comma-separated tags</p>
            </div>
          </div>

          <div className="flex gap-4">
            <button type="submit" disabled={loading} className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold text-sm shadow-lg shadow-primary-200 hover:shadow-xl hover:shadow-primary-300 hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
              {loading ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Posting...</>
              ) : 'Post Question'}
            </button>
            <button type="button" onClick={() => navigate('/questions')} disabled={loading} className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default AskQuestion;
