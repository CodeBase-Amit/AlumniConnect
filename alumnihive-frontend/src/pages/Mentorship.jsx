import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { usersAPI, mentorshipAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { AcademicCapIcon } from '@heroicons/react/24/outline';

const Mentorship = () => {
  const { user } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [myMentorships, setMyMentorships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('find'); // 'find' or 'my'
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'find') {
        const res = await usersAPI.getMentors({ limit: 12 });
        setMentors(res.data.mentors);
      } else {
        const res = await mentorshipAPI.getMentorships();
        setMyMentorships(res.data.mentorships);
      }
    } catch (error) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (!requestMessage.trim()) {
      toast.error('Please provide a message');
      return;
    }

    try {
      await mentorshipAPI.sendRequest({
        mentorId: selectedMentor._id,
        requestMessage,
        goals: [],
        skills: []
      });
      toast.success('Mentorship request sent!');
      setSelectedMentor(null);
      setRequestMessage('');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mentorship</h1>
          <p className="text-gray-600 mt-1">Connect with experienced mentors for guidance and learning</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('find')}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'find'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Find Mentors
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'my'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            My Mentorships
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : activeTab === 'find' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentors.map(mentor => (
                <div key={mentor._id} className="card hover:shadow-lg transition">
                  <img
                    src={mentor.avatar}
                    alt={mentor.name}
                    className="w-full h-32 object-cover rounded-lg mb-4"
                  />
                  <h3 className="font-bold text-lg">{mentor.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{mentor.currentPosition} at {mentor.currentCompany}</p>
                  <p className="text-sm text-gray-700 mb-4">{mentor.mentorDetails?.bio}</p>
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 font-medium mb-2">Expertise:</p>
                    <div className="flex flex-wrap gap-1">
                      {mentor.mentorDetails?.expertise?.slice(0, 3).map((exp, i) => (
                        <span key={i} className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMentor(mentor)}
                    className="btn-primary w-full py-2 text-sm"
                  >
                    Request Mentorship
                  </button>
                </div>
              ))}
            </div>

            {/* Request Modal */}
            {selectedMentor && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-8 max-w-md w-full">
                  <h2 className="text-2xl font-bold mb-4">Request Mentorship</h2>
                  <p className="text-gray-600 mb-4">From: <strong>{selectedMentor.name}</strong></p>
                  <textarea
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder="Tell them why you want to be mentored..."
                    className="input-field mb-4"
                    rows="4"
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSendRequest}
                      className="btn-primary flex-1"
                    >
                      Send Request
                    </button>
                    <button
                      onClick={() => setSelectedMentor(null)}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            {myMentorships.length > 0 ? (
              myMentorships.map(m => (
                <div key={m._id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={m.mentor?.avatar || m.mentee?.avatar}
                        alt="mentor"
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <h3 className="font-bold">
                          {user.role === 'alumni' ? m.mentee?.name : m.mentor?.name}
                        </h3>
                        <p className="text-sm text-gray-500">{m.status}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      m.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {m.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mt-2">{m.requestMessage}</p>
                </div>
              ))
            ) : (
              <div className="card text-center py-12 text-gray-500">
                <AcademicCapIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No mentorships yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Mentorship;