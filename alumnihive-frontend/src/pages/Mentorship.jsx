import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { usersAPI, mentorshipAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  AcademicCapIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { resolveMediaUrl } from '../utils/constants';

const Mentorship = () => {
  const { user, refreshUser } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [myMentorships, setMyMentorships] = useState([]);
  const [mentorRequests, setMentorRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('discover');
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [search, setSearch] = useState('');
  const [mentorForm, setMentorForm] = useState({
    expertise: '',
    availability: '',
    maxMentees: 5,
    bio: ''
  });
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab, search]);

  const canManageMentorRequests = user?.role === 'alumni';

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'discover') {
        const res = await mentorshipAPI.getMentorMatches({
          search: search || undefined,
          limit: 12
        });
        setMentors(res.data.mentors);
      }

      if (activeTab === 'my') {
        const res = await mentorshipAPI.getMentorships();
        setMyMentorships(res.data.mentorships);
      }

      if (activeTab === 'requests' && canManageMentorRequests) {
        const res = await mentorshipAPI.getRequests();
        setMentorRequests(res.data.requests);
      }
    } catch (error) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBecomeMentor = async () => {
    const expertise = mentorForm.expertise
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (!expertise.length || !mentorForm.availability.trim() || !mentorForm.bio.trim()) {
      toast.error('Please complete the mentor application fields');
      return;
    }

    try {
      setApplying(true);
      await usersAPI.becomeMentor({
        expertise,
        availability: mentorForm.availability,
        maxMentees: mentorForm.maxMentees,
        bio: mentorForm.bio
      });
      toast.success('Mentor application submitted for review');
      await refreshUser();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit mentor application');
    } finally {
      setApplying(false);
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
        goals: user?.interests || [],
        skills: user?.skills || []
      });
      toast.success('Mentorship request sent!');
      setSelectedMentor(null);
      setRequestMessage('');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    }
  };

  const handleRespondToRequest = async (requestId, status) => {
    try {
      await mentorshipAPI.respondToRequest(requestId, { status });
      toast.success(`Request ${status === 'accepted' ? 'accepted' : 'rejected'}`);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update request');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mentorship</h1>
          <p className="text-gray-600 mt-1">Discover mentors, apply as an alumni mentor, and manage mentorships in one place</p>
        </div>

        {user?.role === 'alumni' && (
          <div className="card border border-primary-100 bg-primary-50/60">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary-700 font-semibold">
                  <ShieldCheckIcon className="w-5 h-5" />
                  <span>Mentor application status</span>
                </div>
                <p className="text-sm text-gray-700">
                  {user.mentorDetails?.applicationStatus === 'approved'
                    ? 'Your mentor profile is active and visible to students.'
                    : user.mentorDetails?.applicationStatus === 'pending'
                      ? 'Your application is waiting for admin approval.'
                      : user.mentorDetails?.applicationStatus === 'rejected'
                        ? `Your application was rejected${user.mentorDetails?.rejectionReason ? `: ${user.mentorDetails.rejectionReason}` : '.'}`
                        : 'Submit your mentor profile so students can find and request your guidance.'}
                </p>
              </div>
              <div className="text-sm text-gray-600 md:text-right">
                <p className="font-medium text-gray-900">Current mentor setup</p>
                <p>{(user.mentorDetails?.expertise || []).join(', ') || 'No expertise listed yet'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'discover'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Find Mentors
          </button>
          {user?.role === 'alumni' && (
            <button
              onClick={() => setActiveTab('apply')}
              className={`px-4 py-3 font-medium border-b-2 transition ${
                activeTab === 'apply'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Mentor Setup
            </button>
          )}
          {canManageMentorRequests && (
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-3 font-medium border-b-2 transition ${
                activeTab === 'requests'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Requests
            </button>
          )}
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
        ) : activeTab === 'apply' && user?.role === 'alumni' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card space-y-4">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-primary-600" />
                <h2 className="text-xl font-bold">Become a mentor</h2>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expertise</label>
                <input
                  type="text"
                  value={mentorForm.expertise}
                  onChange={(e) => setMentorForm({ ...mentorForm, expertise: e.target.value })}
                  className="input-field"
                  placeholder="React, Node.js, Career Growth"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Availability</label>
                <input
                  type="text"
                  value={mentorForm.availability}
                  onChange={(e) => setMentorForm({ ...mentorForm, availability: e.target.value })}
                  className="input-field"
                  placeholder="Weekends, evenings, 2 sessions per month"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max mentees</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={mentorForm.maxMentees}
                  onChange={(e) => setMentorForm({ ...mentorForm, maxMentees: Number(e.target.value) })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bio</label>
                <textarea
                  value={mentorForm.bio}
                  onChange={(e) => setMentorForm({ ...mentorForm, bio: e.target.value })}
                  className="input-field"
                  rows="5"
                  placeholder="Briefly describe your experience and the kind of students you want to mentor"
                />
              </div>
              <button onClick={handleBecomeMentor} disabled={applying} className="btn-primary w-full">
                {applying ? 'Submitting...' : 'Submit Mentor Application'}
              </button>
            </div>

            <div className="card space-y-4">
              <h3 className="text-lg font-bold">What students will see</h3>
              <div className="space-y-3 text-sm text-gray-700">
                <p>Your profile appears in ranked matches after admin approval.</p>
                <p>Students can request mentorship based on their skills, interests, and your listed expertise.</p>
                <p>Set a realistic mentee limit so capacity checks keep your workload manageable.</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                <p className="font-medium text-gray-900 mb-1">Tips</p>
                <p>Use commas to separate expertise topics and keep your bio focused on the kind of support you provide.</p>
              </div>
            </div>
          </div>
        ) : activeTab === 'discover' ? (
          <>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Search by skill, bio, or company"
                />
              </div>
              <p className="text-sm text-gray-500">Ranked matches based on your profile</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentors.map(mentor => (
                <div key={mentor._id} className="card hover:shadow-lg transition border border-gray-100">
                  <img
                    src={resolveMediaUrl(mentor.avatar || 'https://via.placeholder.com/200x120')}
                    alt={mentor.name}
                    className="w-full h-32 object-cover rounded-lg mb-4"
                  />
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="font-bold text-lg">{mentor.name}</h3>
                      <p className="text-sm text-gray-600">{mentor.currentPosition} at {mentor.currentCompany || 'Independent'}</p>
                    </div>
                    <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
                      Match {mentor.matchScore}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-4">{mentor.mentorDetails?.bio || mentor.bio}</p>
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
                  <div className="mb-4 text-xs text-gray-600 space-y-1">
                    {mentor.matchReasons?.slice(0, 2).map((reason) => (
                      <p key={reason}>• {reason}</p>
                    ))}
                    <p>• {mentor.mentorCapacity?.remainingSlots ?? 0} slots available</p>
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
        ) : activeTab === 'requests' && canManageMentorRequests ? (
          <div className="space-y-4">
            {mentorRequests.length > 0 ? (
              mentorRequests.map((request) => (
                <div key={request._id} className="card space-y-4 border border-gray-100">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={resolveMediaUrl(request.mentee?.avatar || 'https://via.placeholder.com/48')}
                        alt={request.mentee?.name || 'Student'}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="font-bold text-lg">{request.mentee?.name}</h3>
                        <p className="text-sm text-gray-500">{request.mentee?.college || 'Student'}</p>
                        <p className="text-xs text-gray-400">Requested on {new Date(request.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleRespondToRequest(request._id, 'accepted')}
                        className="btn-primary px-4 py-2 text-sm"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRespondToRequest(request._id, 'rejected')}
                        className="btn-secondary px-4 py-2 text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 text-sm">
                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="font-semibold text-gray-900 mb-2">Why they want mentorship</p>
                      <p className="text-gray-700">{request.requestMessage}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="font-semibold text-gray-900 mb-2">Skills and goals</p>
                      <p className="text-gray-700 mb-2"><span className="font-medium">Skills:</span> {(request.skills || []).join(', ') || 'Not provided'}</p>
                      <p className="text-gray-700"><span className="font-medium">Goals:</span> {(request.goals || []).join(', ') || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="card text-center py-12 text-gray-500">
                <AcademicCapIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No pending requests right now</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {myMentorships.length > 0 ? (
              myMentorships.map(m => (
                <div key={m._id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={resolveMediaUrl(m.mentor?.avatar || m.mentee?.avatar || 'https://via.placeholder.com/48')}
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