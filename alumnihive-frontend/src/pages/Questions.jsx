import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { questionsAPI } from '../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  QuestionMarkCircleIcon, PlusIcon, ArrowUpIcon,
  ChatBubbleLeftIcon, EyeIcon, CheckCircleIcon,
  TagIcon, ChevronRightIcon, MagnifyingGlassIcon,
  FunnelIcon
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

  const SkeletonCard = () => (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm animate-pulse">
      <div className="flex gap-5">
        <div className="flex flex-col items-center gap-2 min-w-[60px]">
          <div className="h-8 w-8 bg-gray-100 rounded-lg" />
          <div className="h-8 w-8 bg-gray-100 rounded-lg" />
          <div className="h-8 w-8 bg-gray-100 rounded-lg" />
        </div>
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-gray-100 rounded-full w-3/4" />
          <div className="h-3 bg-gray-100 rounded-full w-full" />
          <div className="h-3 bg-gray-100 rounded-full w-5/6" />
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-gray-100 rounded-full" />
            <div className="h-5 w-16 bg-gray-100 rounded-full" />
            <div className="h-5 w-16 bg-gray-100 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-gray-100 rounded-full" />
            <div className="h-3 w-24 bg-gray-100 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Questions & Answers</h1>
            <p className="text-gray-500 text-sm mt-0.5">Ask questions and help others</p>
          </div>
          <Link
            to="/questions/ask"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-sm shrink-0"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Ask Question</span>
          </Link>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <FunnelIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all appearance-none cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat === 'all' ? '' : cat}>
                    {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <CheckCircleIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all appearance-none cursor-pointer"
              >
                {statuses.map((stat) => (
                  <option key={stat} value={stat === 'all' ? '' : stat}>
                    {stat === 'all' ? 'All Status' : stat.charAt(0).toUpperCase() + stat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <TagIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all appearance-none cursor-pointer"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : questions.length > 0 ? (
          <>
            <div className="space-y-3">
              {questions.map((question) => (
                <Link
                  to={`/questions/${question.slug}`}
                  key={question._id}
                  className="group block bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200"
                >
                  <div className="flex gap-5">
                    <div className="flex flex-col items-center gap-3 min-w-[60px]">
                      <div className="flex flex-col items-center">
                        <ArrowUpIcon className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
                        <span className="font-bold text-sm text-gray-700">{question.votes}</span>
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">votes</span>
                      </div>
                      <div className={`flex flex-col items-center ${question.status === 'answered' ? 'text-green-600' : 'text-gray-400'}`}>
                        <ChatBubbleLeftIcon className="w-4 h-4" />
                        <span className="font-bold text-sm">{question.answers?.length || 0}</span>
                        <span className="text-[10px] font-medium uppercase tracking-wide">answers</span>
                      </div>
                      <div className="flex flex-col items-center text-gray-400">
                        <EyeIcon className="w-4 h-4" />
                        <span className="font-bold text-sm">{question.views}</span>
                        <span className="text-[10px] font-medium uppercase tracking-wide">views</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-primary-600 transition-colors mb-1.5">
                        {question.title}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{question.content}</p>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 text-[11px] font-medium rounded-lg">
                          {question.category}
                        </span>
                        {question.tags?.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 text-[11px] font-medium rounded-lg">
                            <TagIcon className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                        {question.status === 'answered' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-[11px] font-medium rounded-lg">
                            <CheckCircleIcon className="w-3 h-3" />
                            Answered
                          </span>
                        )}
                        {question.status === 'closed' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-500 text-[11px] font-medium rounded-lg">
                            Closed
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-gray-400">
                        <Avatar name={question.author?.name} className="w-5 h-5 text-[9px]" />
                        <span className="font-medium text-gray-500">{question.author?.name || 'Anonymous'}</span>
                        <span className="text-gray-300">•</span>
                        <span>{formatDate(question.createdAt)}</span>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center self-center">
                      <ChevronRightIcon className="w-5 h-5 text-gray-300 group-hover:text-primary-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3.5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('ellipsis');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === 'ellipsis' ? (
                      <span key={`e-${idx}`} className="px-2 py-2 text-sm text-gray-400">...</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-9 h-9 text-sm font-medium rounded-xl transition-all ${
                          p === page
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3.5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl p-12 shadow-sm text-center">
            <QuestionMarkCircleIcon className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <h3 className="text-base font-semibold text-gray-500 mb-1">No questions found</h3>
            <p className="text-sm text-gray-400 mb-4">Try adjusting your search or filters</p>
            <Link
              to="/questions/ask"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Ask a Question
            </Link>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Questions;
