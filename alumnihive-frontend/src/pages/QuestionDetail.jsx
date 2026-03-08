import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { questionsAPI } from '../services/api';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  ArrowUpIcon, 
  ArrowDownIcon,
  CheckCircleIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { useAuth } from '../contexts/AuthContext';
import { resolveMediaUrl } from '../utils/constants';

const QuestionDetail = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answerText, setAnswerText] = useState('');
  const [userVote, setUserVote] = useState(null); // 'up', 'down', or null

  useEffect(() => {
    loadQuestion();
  }, [slug]);

  const loadQuestion = async () => {
    try {
      setLoading(true);
      const res = await questionsAPI.getQuestionBySlug(slug);
      setQuestion(res.data.question);
      
      // Check user vote
      if (user) {
        const userId = user.id || user._id;
        if (res.data.question.upvotedBy?.includes(userId)) {
          setUserVote('up');
        } else if (res.data.question.downvotedBy?.includes(userId)) {
          setUserVote('down');
        }
      }
    } catch (error) {
      toast.error('Failed to load question');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoteQuestion = async (voteType) => {
    if (!user) {
      toast.error('Please login to vote');
      return;
    }
    
    try {
      await questionsAPI.voteQuestion(question._id, voteType);
      setUserVote(userVote === voteType ? null : voteType);
      loadQuestion();
    } catch (error) {
      toast.error('Failed to vote');
    }
  };

  const handleVoteAnswer = async (answerId, voteType) => {
    if (!user) {
      toast.error('Please login to vote');
      return;
    }
    
    try {
      await questionsAPI.voteAnswer(question._id, answerId, voteType);
      loadQuestion();
    } catch (error) {
      toast.error('Failed to vote');
    }
  };

  const handleAddAnswer = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to answer');
      return;
    }
    
    if (!answerText.trim()) return;
    
    try {
      await questionsAPI.addAnswer(question._id, { content: answerText });
      toast.success('Answer posted!');
      setAnswerText('');
      loadQuestion();
    } catch (error) {
      toast.error('Failed to post answer');
    }
  };

  const handleAcceptAnswer = async (answerId) => {
    try {
      await questionsAPI.acceptAnswer(question._id, answerId);
      toast.success('Answer accepted!');
      loadQuestion();
    } catch (error) {
      toast.error('Failed to accept answer');
    }
  };

  const handleDeleteQuestion = async () => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    
    try {
      await questionsAPI.deleteQuestion(question._id);
      toast.success('Question deleted!');
      navigate('/questions');
    } catch (error) {
      toast.error('Failed to delete question');
    }
  };

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

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
        </div>
      </MainLayout>
    );
  }

  if (!question) {
    return (
      <MainLayout>
        <p className="text-center py-12 text-gray-500">Question not found</p>
      </MainLayout>
    );
  }

  const isAuthor = user && question.author && 
    (user.id === question.author._id || user._id === question.author._id);

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">
        {/* Question */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex gap-4">
            {/* Vote Section */}
            <div className="flex flex-col items-center space-y-2">
              <button
                onClick={() => handleVoteQuestion('up')}
                className={`p-2 rounded-lg transition ${
                  userVote === 'up' 
                    ? 'bg-green-100 text-green-600' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <ArrowUpIcon className="w-8 h-8" />
              </button>
              <span className="text-2xl font-bold">{question.votes}</span>
              <button
                onClick={() => handleVoteQuestion('down')}
                className={`p-2 rounded-lg transition ${
                  userVote === 'down' 
                    ? 'bg-red-100 text-red-600' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <ArrowDownIcon className="w-8 h-8" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{question.title}</h1>
                {isAuthor && (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleDeleteQuestion}
                      className="text-red-600 hover:text-red-700 p-2"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="prose max-w-none mb-4">
                <p className="text-gray-700 whitespace-pre-wrap">{question.content}</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full">
                    {question.category}
                  </span>
                  {question.tags && question.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center space-x-3 text-sm">
                  <img
                    src={resolveMediaUrl(question.author?.avatar || 'https://via.placeholder.com/40')}
                    alt={question.author?.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{question.author?.name}</p>
                    <p className="text-gray-500">{formatDate(question.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Answers Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">
            {question.answers?.length || 0} Answers
          </h2>

          {/* Answers List */}
          <div className="space-y-6 mb-8">
            {question.answers && question.answers.length > 0 ? (
              question.answers
                .sort((a, b) => {
                  // Accepted answer first
                  if (a.isAccepted) return -1;
                  if (b.isAccepted) return 1;
                  // Then by votes
                  return b.votes - a.votes;
                })
                .map((answer) => {
                  const answerUserId = user?.id || user?._id;
                  const hasUpvoted = answer.upvotedBy?.includes(answerUserId);
                  const hasDownvoted = answer.downvotedBy?.includes(answerUserId);
                  
                  return (
                    <div
                      key={answer._id}
                      className={`border rounded-lg p-6 ${
                        answer.isAccepted ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex gap-4">
                        {/* Vote Section */}
                        <div className="flex flex-col items-center space-y-2">
                          <button
                            onClick={() => handleVoteAnswer(answer._id, 'up')}
                            className={`p-2 rounded-lg transition ${
                              hasUpvoted 
                                ? 'bg-green-100 text-green-600' 
                                : 'hover:bg-gray-100 text-gray-600'
                            }`}
                          >
                            <ArrowUpIcon className="w-6 h-6" />
                          </button>
                          <span className="text-xl font-bold">{answer.votes}</span>
                          <button
                            onClick={() => handleVoteAnswer(answer._id, 'down')}
                            className={`p-2 rounded-lg transition ${
                              hasDownvoted 
                                ? 'bg-red-100 text-red-600' 
                                : 'hover:bg-gray-100 text-gray-600'
                            }`}
                          >
                            <ArrowDownIcon className="w-6 h-6" />
                          </button>
                          {isAuthor && !answer.isAccepted && (
                            <button
                              onClick={() => handleAcceptAnswer(answer._id)}
                              className="mt-2 p-2 rounded-lg hover:bg-green-100 text-gray-400 hover:text-green-600 transition"
                              title="Accept this answer"
                            >
                              <CheckCircleIcon className="w-6 h-6" />
                            </button>
                          )}
                          {answer.isAccepted && (
                            <CheckCircleIconSolid className="w-8 h-8 text-green-600 mt-2" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          {answer.isAccepted && (
                            <div className="flex items-center space-x-2 mb-3">
                              <CheckCircleIconSolid className="w-5 h-5 text-green-600" />
                              <span className="text-sm font-semibold text-green-700">
                                Accepted Answer
                              </span>
                            </div>
                          )}
                          
                          <p className="text-gray-700 whitespace-pre-wrap mb-4">
                            {answer.content}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 text-sm">
                              <img
                                src={resolveMediaUrl(answer.author?.avatar || 'https://via.placeholder.com/32')}
                                alt={answer.author?.name}
                                className="w-8 h-8 rounded-full"
                              />
                              <div>
                                <p className="font-medium text-gray-900">{answer.author?.name}</p>
                                <p className="text-gray-500">{formatDate(answer.createdAt)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
            ) : (
              <p className="text-center text-gray-500 py-8">
                No answers yet. Be the first to answer!
              </p>
            )}
          </div>

          {/* Answer Form */}
          <div className="border-t pt-6">
            <h3 className="text-xl font-semibold mb-4">Your Answer</h3>
            {user ? (
              <form onSubmit={handleAddAnswer} className="space-y-4">
                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Write your answer here..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows="8"
                  required
                />
                <button
                  type="submit"
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition"
                >
                  Post Answer
                </button>
              </form>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-600">
                  Please <Link to="/login" className="text-red-600 hover:text-red-700">login</Link> to answer
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default QuestionDetail;