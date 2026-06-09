import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { questionsAPI } from '../services/api';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowUpIcon, ArrowDownIcon, CheckCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
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

  if (loading) return <MainLayout><div className="text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-[3px] border-primary-600 border-t-transparent mx-auto"></div></div></MainLayout>;
  if (!question) return <MainLayout><p className="text-center py-12 text-gray-400">Question not found</p></MainLayout>;

  const isAuthor = user && question.author && (user.id === question.author._id || user._id === question.author._id);

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="card">
          <div className="flex gap-4">
            <div className="flex flex-col items-center gap-1.5">
              <button onClick={() => handleVoteQuestion('up')} className={`p-1.5 rounded-lg transition cursor-pointer ${userVote === 'up' ? 'bg-accent-100 text-accent-600' : 'hover:bg-gray-100 text-gray-400'}`}>
                <ArrowUpIcon className="w-6 h-6" /></button>
              <span className="text-lg font-bold text-gray-900">{question.votes}</span>
              <button onClick={() => handleVoteQuestion('down')} className={`p-1.5 rounded-lg transition cursor-pointer ${userVote === 'down' ? 'bg-red-100 text-red-500' : 'hover:bg-gray-100 text-gray-400'}`}>
                <ArrowDownIcon className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h1 className="text-xl font-bold text-gray-900">{question.title}</h1>
                {isAuthor && <button onClick={handleDeleteQuestion} className="p-1.5 text-gray-400 hover:text-red-500 cursor-pointer"><TrashIcon className="w-5 h-5" /></button>}
              </div>
              <p className="text-gray-600 whitespace-pre-wrap mb-4">{question.content}</p>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="badge-primary text-xs">{question.category}</span>
                {question.tags?.map((tag, idx) => <span key={idx} className="badge-gray text-xs">#{tag}</span>)}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Avatar name={question.author?.name} className="w-6 h-6 text-xs" />
                <span className="font-medium text-gray-700">{question.author?.name}</span>
                <span>•</span>
                <span>{formatDate(question.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="font-bold text-gray-900 mb-4">{question.answers?.length || 0} Answers</h2>

          <div className="space-y-4 mb-6">
            {question.answers?.length > 0 ? [...question.answers].sort((a, b) => {
              if (a.isAccepted) return -1; if (b.isAccepted) return 1; return b.votes - a.votes;
            }).map((answer) => {
              const answerUserId = user?.id || user?._id;
              const hasUpvoted = answer.upvotedBy?.includes(answerUserId);
              const hasDownvoted = answer.downvotedBy?.includes(answerUserId);
              return (
                <div key={answer._id} className={`rounded-xl border p-4 ${answer.isAccepted ? 'border-accent-500 bg-accent-50/50' : 'border-gray-100'}`}>
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <button onClick={() => handleVoteAnswer(answer._id, 'up')} className={`p-1 rounded cursor-pointer ${hasUpvoted ? 'text-accent-600' : 'text-gray-400 hover:text-gray-600'}`}><ArrowUpIcon className="w-5 h-5" /></button>
                      <span className="text-sm font-bold">{answer.votes}</span>
                      <button onClick={() => handleVoteAnswer(answer._id, 'down')} className={`p-1 rounded cursor-pointer ${hasDownvoted ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'}`}><ArrowDownIcon className="w-5 h-5" /></button>
                      {isAuthor && !answer.isAccepted && (
                        <button onClick={() => handleAcceptAnswer(answer._id)} className="p-1 text-gray-400 hover:text-accent-600 cursor-pointer" title="Accept this answer"><CheckCircleIcon className="w-5 h-5" /></button>
                      )}
                      {answer.isAccepted && <CheckCircleIconSolid className="w-6 h-6 text-accent-600" />}
                    </div>
                    <div className="flex-1">
                      {answer.isAccepted && <p className="text-xs font-semibold text-accent-600 mb-2 flex items-center gap-1"><CheckCircleIconSolid className="w-4 h-4" /> Accepted Answer</p>}
                      <p className="text-gray-600 text-sm whitespace-pre-wrap mb-3">{answer.content}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Avatar name={answer.author?.name} className="w-5 h-5 text-[10px]" />
                        <span className="font-medium text-gray-700">{answer.author?.name}</span>
                        <span>•</span>
                        <span>{formatDate(answer.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }) : <p className="text-center text-gray-400 text-sm py-4">No answers yet. Be the first!</p>}
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Your Answer</h3>
            {user ? (
              <form onSubmit={handleAddAnswer} className="space-y-3">
                <textarea value={answerText} onChange={(e) => setAnswerText(e.target.value)} placeholder="Write your answer..." className="input-field" rows={6} required />
                <button type="submit" className="btn-primary">Post Answer</button>
              </form>
            ) : (
              <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-500">
                Please <Link to="/login" className="text-link">login</Link> to answer
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default QuestionDetail;
