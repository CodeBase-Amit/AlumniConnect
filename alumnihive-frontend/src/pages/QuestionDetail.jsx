import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { questionsAPI } from '../services/api';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  TrashIcon,
  ChatBubbleLeftIcon,
  TagIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/Avatar';

const QuestionDetail = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answerText, setAnswerText] = useState('');
  const [userVote, setUserVote] = useState(null);

  useEffect(() => { loadQuestion(); }, [slug]);

  const loadQuestion = async () => {
    try {
      setLoading(true);
      const res = await questionsAPI.getQuestionBySlug(slug);
      setQuestion(res.data.question);
      if (user) {
        const userId = user.id || user._id;
        if (res.data.question.upvotedBy?.includes(userId)) setUserVote('up');
        else if (res.data.question.downvotedBy?.includes(userId)) setUserVote('down');
      }
    } catch (error) { toast.error('Failed to load question'); } finally { setLoading(false); }
  };

  const handleVoteQuestion = async (voteType) => {
    if (!user) { toast.error('Please login to vote'); return; }
    try { await questionsAPI.voteQuestion(question._id, voteType); setUserVote(userVote === voteType ? null : voteType); loadQuestion(); }
    catch (error) { toast.error('Failed to vote'); }
  };

  const handleVoteAnswer = async (answerId, voteType) => {
    if (!user) { toast.error('Please login to vote'); return; }
    try { await questionsAPI.voteAnswer(question._id, answerId, voteType); loadQuestion(); }
    catch (error) { toast.error('Failed to vote'); }
  };

  const handleAddAnswer = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to answer'); return; }
    if (!answerText.trim()) return;
    try { await questionsAPI.addAnswer(question._id, { content: answerText }); toast.success('Answer posted!'); setAnswerText(''); loadQuestion(); }
    catch (error) { toast.error('Failed to post answer'); }
  };

  const handleAcceptAnswer = async (answerId) => {
    try { await questionsAPI.acceptAnswer(question._id, answerId); toast.success('Answer accepted!'); loadQuestion(); }
    catch (error) { toast.error('Failed to accept answer'); }
  };

  const handleDeleteQuestion = async () => {
    if (!window.confirm('Delete this question?')) return;
    try { await questionsAPI.deleteQuestion(question._id); toast.success('Question deleted!'); navigate('/questions'); }
    catch (error) { toast.error('Failed to delete question'); }
  };

  const formatDate = (date) => {
    const diffDays = Math.floor(Math.abs(new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto space-y-5 animate-pulse">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                <div className="w-8 h-5 bg-gray-200 rounded" />
                <div className="w-10 h-10 bg-gray-200 rounded-xl" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="h-7 bg-gray-200 rounded-lg w-3/4" />
                <div className="h-4 bg-gray-200 rounded-lg w-full" />
                <div className="h-4 bg-gray-200 rounded-lg w-2/3" />
                <div className="flex gap-2 pt-1">
                  <div className="h-6 w-16 bg-gray-200 rounded-full" />
                  <div className="h-6 w-20 bg-gray-200 rounded-full" />
                  <div className="h-6 w-14 bg-gray-200 rounded-full" />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <div className="w-7 h-7 bg-gray-200 rounded-full" />
                  <div className="h-4 w-24 bg-gray-200 rounded-lg" />
                  <div className="h-4 w-16 bg-gray-200 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="h-6 w-32 bg-gray-200 rounded-lg mb-5" />
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-4 p-4 border border-gray-100 rounded-xl">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                    <div className="w-6 h-4 bg-gray-200 rounded" />
                    <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded-lg w-full" />
                    <div className="h-4 bg-gray-200 rounded-lg w-5/6" />
                    <div className="flex items-center gap-2 pt-1">
                      <div className="w-6 h-6 bg-gray-200 rounded-full" />
                      <div className="h-3 w-20 bg-gray-200 rounded-lg" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!question) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <ChatBubbleLeftIcon className="w-20 h-20 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 text-lg font-medium">Question not found</p>
            <p className="text-gray-300 text-sm mt-1">This question may have been removed or doesn't exist.</p>
            <Link to="/questions" className="inline-block mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium">
              &larr; Back to Questions
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const isAuthor = user && question.author && (user.id === question.author._id || user._id === question.author._id);

  const sortedAnswers = question.answers?.length
    ? [...question.answers].sort((a, b) => {
        if (a.isAccepted) return -1;
        if (b.isAccepted) return 1;
        return b.votes - a.votes;
      })
    : [];

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex gap-4">
            {/* Voting Sidebar */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => handleVoteQuestion('up')}
                className={`p-2 rounded-xl transition-all duration-150 cursor-pointer ${
                  userVote === 'up'
                    ? 'bg-green-50 text-green-600 shadow-sm'
                    : 'text-gray-300 hover:text-green-500 hover:bg-green-50/50'
                }`}
              >
                <ArrowUpIcon className="w-6 h-6" />
              </button>
              <span className={`text-lg font-extrabold tabular-nums ${
                userVote === 'up' ? 'text-green-600' : userVote === 'down' ? 'text-red-500' : 'text-gray-800'
              }`}>
                {question.votes}
              </span>
              <button
                onClick={() => handleVoteQuestion('down')}
                className={`p-2 rounded-xl transition-all duration-150 cursor-pointer ${
                  userVote === 'down'
                    ? 'bg-red-50 text-red-500 shadow-sm'
                    : 'text-gray-300 hover:text-red-400 hover:bg-red-50/50'
                }`}
              >
                <ArrowDownIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Title + Delete */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">{question.title}</h1>
                {isAuthor && (
                  <button
                    onClick={handleDeleteQuestion}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-150 shrink-0 cursor-pointer"
                    title="Delete question"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Content */}
              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed mb-5">{question.content}</p>

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-2 mb-5">
                {question.tags?.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium"
                  >
                    <TagIcon className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>

              {/* Author Info */}
              <div className="flex items-center gap-3 text-sm">
                <Avatar name={question.author?.name} className="w-8 h-8 text-xs" />
                <span className="font-semibold text-gray-800">{question.author?.name}</span>
                <span className="text-gray-300">•</span>
                <ClockIcon className="w-4 h-4 text-gray-300" />
                <span className="text-gray-400">{formatDate(question.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Answers Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {/* Answer Count Header */}
          <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
            <ChatBubbleLeftIcon className="w-5 h-5 text-gray-400" />
            {question.answers?.length || 0} {question.answers?.length === 1 ? 'Answer' : 'Answers'}
          </h2>

          {/* Answers List */}
          <div className="space-y-4 mb-6">
            {sortedAnswers.length > 0 ? (
              sortedAnswers.map((answer) => {
                const answerUserId = user?.id || user?._id;
                const hasUpvoted = answer.upvotedBy?.includes(answerUserId);
                const hasDownvoted = answer.downvotedBy?.includes(answerUserId);
                return (
                  <div
                    key={answer._id}
                    className={`rounded-xl border p-5 transition-all duration-200 ${
                      answer.isAccepted
                        ? 'border-green-300 bg-green-50/40'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Voting Sidebar */}
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => handleVoteAnswer(answer._id, 'up')}
                          className={`p-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
                            hasUpvoted
                              ? 'bg-green-50 text-green-600'
                              : 'text-gray-300 hover:text-green-500 hover:bg-green-50/50'
                          }`}
                        >
                          <ArrowUpIcon className="w-5 h-5" />
                        </button>
                        <span className={`text-sm font-bold tabular-nums ${
                          hasUpvoted ? 'text-green-600' : hasDownvoted ? 'text-red-500' : 'text-gray-700'
                        }`}>
                          {answer.votes}
                        </span>
                        <button
                          onClick={() => handleVoteAnswer(answer._id, 'down')}
                          className={`p-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
                            hasDownvoted
                              ? 'bg-red-50 text-red-500'
                              : 'text-gray-300 hover:text-red-400 hover:bg-red-50/50'
                          }`}
                        >
                          <ArrowDownIcon className="w-5 h-5" />
                        </button>
                        {isAuthor && !answer.isAccepted && (
                          <button
                            onClick={() => handleAcceptAnswer(answer._id)}
                            className="p-1.5 text-gray-300 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-150 cursor-pointer"
                            title="Accept this answer"
                          >
                            <CheckCircleIcon className="w-5 h-5" />
                          </button>
                        )}
                        {answer.isAccepted && (
                          <CheckCircleIconSolid className="w-6 h-6 text-green-600" />
                        )}
                      </div>

                      {/* Answer Content */}
                      <div className="flex-1 min-w-0">
                        {answer.isAccepted && (
                          <div className="flex items-center gap-1.5 mb-2">
                            <CheckCircleIconSolid className="w-4 h-4 text-green-600" />
                            <span className="text-xs font-bold text-green-600 uppercase tracking-wide">Accepted</span>
                          </div>
                        )}
                        <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed mb-3">
                          {answer.content}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <Avatar name={answer.author?.name} className="w-6 h-6 text-[10px]" />
                          <span className="font-semibold text-gray-700">{answer.author?.name}</span>
                          <span className="text-gray-300">•</span>
                          <ClockIcon className="w-3.5 h-3.5 text-gray-300" />
                          <span className="text-gray-400">{formatDate(answer.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10">
                <ChatBubbleLeftIcon className="w-14 h-14 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm font-medium">No answers yet</p>
                <p className="text-gray-300 text-xs mt-1">Be the first to share your knowledge!</p>
              </div>
            )}
          </div>

          {/* Your Answer Form */}
          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-base font-bold text-gray-900 mb-4">Your Answer</h3>
            {user ? (
              <form onSubmit={handleAddAnswer} className="space-y-4">
                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Write a detailed answer..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all duration-150 resize-y min-h-[140px]"
                  rows={6}
                  required
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-all duration-150 shadow-sm cursor-pointer"
                >
                  <ChatBubbleLeftIcon className="w-4 h-4" />
                  Post Answer
                </button>
              </form>
            ) : (
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <Link
                  to="/login"
                  className="text-primary-600 hover:text-primary-700 font-semibold text-sm transition-colors"
                >
                  Log in
                </Link>
                <span className="text-gray-400 text-sm ml-1">to post an answer</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default QuestionDetail;
