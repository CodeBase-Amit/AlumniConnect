import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { qaAPI } from '../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { QuestionMarkCircleIcon, PlusIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const Questions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('recent');

  useEffect(() => {
    loadQuestions();
  }, [search, category, sort]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const res = await qaAPI.getQuestions({
        search: search || undefined,
        category: category || undefined,
        sort,
        limit: 20
      });
      setQuestions(res.data.questions);
    } catch (error) {
      toast.error('Failed to load questions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['technical', 'career', 'academic', 'general', 'other'];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Q&A Forum</h1>
            <p className="text-gray-600 mt-1">Ask questions and get answers from the community</p>
          </div>
          <Link to="/questions/ask" className="btn-primary flex items-center space-x-2">
            <PlusIcon className="w-5 h-5" />
            <span>Ask Question</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="card space-y-4">
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-field"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="input-field"
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
              <option value="unanswered">Unanswered</option>
            </select>
          </div>
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : questions.length > 0 ? (
          <div className="space-y-3">
            {questions.map(q => (
              <Link
                to={`/questions/${q._id}`}
                key={q._id}
                className="card hover:shadow-lg transition"
              >
                <div className="flex gap-4">
                  <div className="flex flex-col items-center text-center min-w-fit">
                    <div className="text-lg font-bold text-gray-900">{q.upvotes?.length || 0}</div>
                    <div className="text-xs text-gray-600">votes</div>
                    <div className="mt-2 text-lg font-bold text-gray-900">
                      {q.answers?.length || 0}
                    </div>
                    <div className="text-xs text-gray-600">answers</div>
                    {q.isSolved && (
                      <CheckCircleIcon className="w-6 h-6 text-green-500 mt-2" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{q.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">{q.content}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <img
                          src={q.author?.avatar}
                          alt={q.author?.name}
                          className="w-6 h-6 rounded-full"
                        />
                        <span>{q.author?.name}</span>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {q.category}
                        </span>
                      </div>
                      <span>{q.views} views</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12 text-gray-500">
            <QuestionMarkCircleIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No questions found</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Questions;