import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { qaAPI } from '../services/api';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { ArrowUpIcon, ArrowDownIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

const QuestionDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answerText, setAnswerText] = useState('');

  useEffect(() => {
    loadQuestion();
  }, [id]);

  const loadQuestion = async () => {
    try {
      setLoading(true);
      const res = await qaAPI.getQuestionById(id);
      setQuestion(res.data.question);
    } catch (error) {
      toast.error('Failed to load question');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoteQuestion = async (voteType) => {
    try {
      await qaAPI.voteQuestion(id, { voteType });
      toast.success(`Vote recorded!`);
      loadQuestion();
    } catch (error) {
      toast.error('Failed to vote');
    }
  };

  const handleAddAnswer = async (e) => {
    e.preventDefault();
    if (!answerText.trim()) return;

    try {
      await qaAPI.addAnswer(id, { content: answerText });
      toast.success('Answer added!');
      setAnswerText('');
      loadQuestion();
    } catch (error) {
      toast.error('Failed to add answer');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </MainLayout>
    );
  }

  if (!question) {
    return <MainLayout><p>Question not found</p></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        {/* Question */}
        <div className="card mb-6">
          <div className="flex gap-4">
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => handleVoteQuestion('upvote')}
                className="p-2 hover:bg-primary-100 rounded text-gray-600 hover:text-primary-600"
              >
                <ArrowUpIcon className="w-6 h-6" />
              </button>
              <span className="font-bold">{question.upvotes?.length || 0}</span>
              <button
                onClick={() => handleVoteQuestion('downvote')}
                className="p-2 hover:bg-red-100 rounded text-gray-600 hover:text-red-600"
              >
                <ArrowDownIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{question.title}</h1>
              <p className="text-gray-700 mb-4">{question.content}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-3">
                  <img
                    src={question.author?.avatar}
                    alt={question.author?.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <p className="font-medium">{question.author?.name}</p>
                    <p className="text-xs">
                      {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <span>{question.views} views</span>
              </div>
            </div>
            {question.isSolved && (
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
            )}
          </div>
        </div>

        {/* Answers */}
        <div className="space-y-4 mb-6">
          <h2 className="text-xl font-bold">{question.answers?.length || 0} Answers</h2>
          {question.answers?.map(answer => (
            <div key={answer._id} className="card">
              <div className="flex gap-4">
                <div className="flex flex-col items-center gap-2">
                  <button className="p-2 hover:bg-primary-100 rounded text-gray-600">
                    <ArrowUpIcon className="w-5 h-5" />
                  </button>
                  <span className="text-sm font-bold">{answer.upvotes?.length || 0}</span>
                  <button className="p-2 hover:bg-red-100 rounded text-gray-600">
                    <ArrowDownIcon className="w-5 h-5" />
                  </button>
                  {answer.isAccepted && (
                    <CheckCircleIcon className="w-6 h-6 text-green-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 mb-3">{answer.content}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-3">
                      <img
                        src={answer.user?.avatar}
                        alt={answer.user?.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <p className="font-medium">{answer.user?.name}</p>
                        <p className="text-xs">
                          {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    {!answer.isAccepted && question.author._id === user._id && (
                      <button
                        onClick={() => {
                          qaAPI.acceptAnswer(question._id, answer._id);
                          loadQuestion();
                        }}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Accept Answer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Answer */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Your Answer</h2>
          <form onSubmit={handleAddAnswer} className="space-y-4">
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Share your answer..."
              className="input-field"
              rows="5"
            />
            <button type="submit" className="btn-primary">
              Post Answer
            </button>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default QuestionDetail;