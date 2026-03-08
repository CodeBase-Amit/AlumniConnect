import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { questionsAPI } from '../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  QuestionMarkCircleIcon, 
  PlusIcon, 
  ArrowUpIcon,
  ChatBubbleLeftIcon,
  EyeIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { resolveMediaUrl } from '../utils/constants';

const Questions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadQuestions();
  }, [search, category, status, sort, page]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const res = await questionsAPI.getQuestions({
        search: search || undefined,
        category: category || undefined,
        status: status || undefined,
        sort: sort || undefined,
        page,
        limit: 20
      });
      setQuestions(res.data.questions);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      toast.error('Failed to load questions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'technical', 'career', 'academic', 'general', 'other'];
  const statuses = ['all', 'open', 'answered', 'closed'];
  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'votes', label: 'Most Votes' },
    { value: 'views', label: 'Most Views' },
    { value: 'answers', label: 'Most Answers' }
  ];

  const formatDate = (date) => {
    const now = new Date();
    const questionDate = new Date(date);
    const diffTime = Math.abs(now - questionDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">❓ Questions & Answers</h1>
            <p className="text-gray-600 mt-1">Ask questions and help others</p>
          </div>
          <Link 
            to="/questions/ask" 
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition flex items-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Ask Question</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat === 'all' ? '' : cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              {statuses.map((stat) => (
                <option key={stat} value={stat === 'all' ? '' : stat}>
                  {stat.charAt(0).toUpperCase() + stat.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          </div>
        ) : questions.length > 0 ? (
          <>
            <div className="space-y-4">
              {questions.map((question) => (
                <Link
                  to={`/questions/${question.slug}`}
                  key={question._id}
                  className="block bg-white rounded-lg shadow-md hover:shadow-lg transition p-6"
                >
                  <div className="flex gap-6">
                    {/* Stats */}
                    <div className="flex flex-col items-center space-y-3 text-sm text-gray-600 min-w-[80px]">
                      <div className="flex flex-col items-center">
                        <ArrowUpIcon className="w-5 h-5" />
                        <span className="font-semibold">{question.votes}</span>
                        <span className="text-xs">votes</span>
                      </div>
                      <div className={`flex flex-col items-center ${
                        question.status === 'answered' ? 'text-green-600' : ''
                      }`}>
                        {question.status === 'answered' && <CheckCircleIcon className="w-5 h-5" />}
                        <span className="font-semibold">{question.answers?.length || 0}</span>
                        <span className="text-xs">answers</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <EyeIcon className="w-5 h-5" />
                        <span className="font-semibold">{question.views}</span>
                        <span className="text-xs">views</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-red-600">
                        {question.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {question.content}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                            {question.category}
                          </span>
                          {question.tags && question.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {question.status === 'answered' && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center space-x-1">
                              <CheckCircleIcon className="w-3 h-3" />
                              <span>Answered</span>
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <img
                            src={resolveMediaUrl(question.author?.avatar || 'https://via.placeholder.com/32')}
                            alt={question.author?.name}
                            className="w-6 h-6 rounded-full"
                          />
                          <span>{question.author?.name}</span>
                          <span>•</span>
                          <span>{formatDate(question.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md text-center py-12 text-gray-500">
            <QuestionMarkCircleIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No questions found</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Questions;