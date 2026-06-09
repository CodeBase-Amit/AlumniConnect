import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { questionsAPI } from '../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  QuestionMarkCircleIcon, PlusIcon, ArrowUpIcon,
  ChatBubbleLeftIcon, EyeIcon, CheckCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import Avatar from '../components/Avatar';

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
        search: search || undefined, category: category || undefined,
        status: status || undefined, sort: sort || undefined, page, limit: 20
      });
      setQuestions(res.data.questions);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      toast.error('Failed to load questions');
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
    const diffDays = Math.floor(Math.abs(new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <MainLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Questions & Answers</h1>
            <p className="text-gray-500 text-sm mt-0.5">Ask questions and help others</p>
          </div>
          <Link to="/questions/ask" className="btn-primary shrink-0">
            <PlusIcon className="w-5 h-5" />
            <span>Ask Question</span>
          </Link>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search questions..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="select-field">
              {categories.map((cat) => (
                <option key={cat} value={cat === 'all' ? '' : cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="select-field">
              {statuses.map((stat) => (
                <option key={stat} value={stat === 'all' ? '' : stat}>{stat.charAt(0).toUpperCase() + stat.slice(1)}</option>
              ))}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="select-field">
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-primary-600 border-t-transparent mx-auto"></div>
          </div>
        ) : questions.length > 0 ? (
          <>
            <div className="space-y-3">
              {questions.map((question) => (
                <Link to={`/questions/${question.slug}`} key={question._id} className="card-hover block">
                  <div className="flex gap-5">
                    <div className="flex flex-col items-center gap-1.5 min-w-[60px]">
                      <div className="flex flex-col items-center">
                        <ArrowUpIcon className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold text-sm">{question.votes}</span>
                        <span className="text-[10px] text-gray-400">votes</span>
                      </div>
                      <div className={`flex flex-col items-center ${question.status === 'answered' ? 'text-accent-600' : 'text-gray-400'}`}>
                        {question.status === 'answered' && <CheckCircleIcon className="w-4 h-4" />}
                        <span className="font-semibold text-sm">{question.answers?.length || 0}</span>
                        <span className="text-[10px]">answers</span>
                      </div>
                      <div className="flex flex-col items-center text-gray-400">
                        <EyeIcon className="w-4 h-4" />
                        <span className="font-semibold text-sm">{question.views}</span>
                        <span className="text-[10px]">views</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 hover:text-primary-600 transition-colors">{question.title}</h3>
                      <p className="text-gray-500 text-sm line-clamp-2 mb-2">{question.content}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="badge-primary text-[11px]">{question.category}</span>
                        {question.tags?.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="badge-gray text-[11px]">{tag}</span>
                        ))}
                        {question.status === 'answered' && (
                          <span className="badge-accent text-[11px] flex items-center gap-0.5">
                            <CheckCircleIcon className="w-3 h-3" /> Answered
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                        <Avatar name={question.author?.name} className="w-5 h-5 text-[10px]" />
                        <span>{question.author?.name}</span>
                        <span>•</span>
                        <span>{formatDate(question.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-4">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost text-sm">Previous</button>
                <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-ghost text-sm">Next</button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <QuestionMarkCircleIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No questions found</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Questions;
