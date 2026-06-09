import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { usersAPI, mentorshipAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { AcademicCapIcon, MagnifyingGlassIcon, ShieldCheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Avatar from '../components/Avatar';
import CoverImage from '../components/CoverImage';

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
  const [mentorForm, setMentorForm] = useState({ expertise: '', availability: '', maxMentees: 5, bio: '' });
  const [applying, setApplying] = useState(false);

  useEffect(() => { loadData(); }, [activeTab, search]);

  const canManageMentorRequests = user?.role === 'alumni';

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'discover') {
        const res = await mentorshipAPI.getMentorMatches({ search: search || undefined, limit: 12 });
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
    } finally {
      setLoading(false);
    }
  };

  const handleBecomeMentor = async () => {
    const expertise = mentorForm.expertise.split(',').map(i => i.trim()).filter(Boolean);
    if (!expertise.length || !mentorForm.availability.trim() || !mentorForm.bio.trim()) {
      toast.error('Please complete all fields'); return;
    }
    try {
      setApplying(true);
      await usersAPI.becomeMentor({ expertise, availability: mentorForm.availability, maxMentees: mentorForm.maxMentees, bio: mentorForm.bio });
      toast.success('Mentor application submitted for review');
      await refreshUser();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit');
    } finally { setApplying(false); }
  };

  const handleSendRequest = async () => {
    if (!requestMessage.trim()) { toast.error('Please provide a message'); return; }
    try {
      await mentorshipAPI.sendRequest({ mentorId: selectedMentor._id, requestMessage, goals: user?.interests || [], skills: user?.skills || [] });
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
      toast.success(`Request ${status}`);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update');
    }
  };

  const statusBadge = (status) => {
    switch (status) {
      case 'active': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'pending': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'accepted': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'rejected': return 'bg-red-50 text-red-700 border border-red-200';
      default: return 'bg-gray-50 text-gray-600 border border-gray-200';
    }
  };

  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-pulse">
      <div className="h-28 bg-gray-200 rounded-xl mb-3" />
      <div className="flex justify-between mb-2">
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-5 bg-gray-200 rounded w-10" />
      </div>
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
      <div className="h-8 bg-gray-200 rounded mb-3" />
      <div className="flex gap-1 mb-3">
        <div className="h-5 bg-gray-200 rounded w-14" />
        <div className="h-5 bg-gray-200 rounded w-16" />
      </div>
      <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
      <div className="h-9 bg-gray-200 rounded w-full" />
    </div>
  );

  const SkeletonList = () => (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div>
                <div className="h-4 bg-gray-200 rounded w-28 mb-1" />
                <div className="h-3 bg-gray-200 rounded w-40" />
              </div>
            </div>
            <div className="h-6 bg-gray-200 rounded w-16" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="relative pb-3">
          <h1 className="text-2xl font-bold text-gray-900">Mentorship</h1>
          <p className="text-gray-500 text-sm mt-0.5">Discover mentors, apply as an alumni, and manage mentorships</p>
          <div className="absolute bottom-0 left-0 w-20 h-1 bg-gradient-to-r from-primary-500 to-primary-400 rounded-full" />
        </div>

        {user?.role === 'alumni' && (
          <div className="bg-gradient-to-r from-primary-50/80 to-primary-50/40 border border-primary-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary-100 rounded-xl shrink-0">
                  <ShieldCheckIcon className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-primary-800 text-sm">Mentor Application Status</p>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    {user.mentorDetails?.applicationStatus === 'approved'
                      ? 'Your mentor profile is active and visible to students.'
                      : user.mentorDetails?.applicationStatus === 'pending'
                        ? 'Your application is under review. You will be notified once approved.'
                        : user.mentorDetails?.applicationStatus === 'rejected'
                          ? `Rejected: ${user.mentorDetails?.rejectionReason || 'No reason provided'}`
                          : 'Submit your mentor profile to start guiding students.'}
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500 text-right shrink-0">
                <p className="font-medium text-gray-700 mb-0.5">Expertise</p>
                <p className="text-gray-400">{(user.mentorDetails?.expertise || []).join(', ') || 'None'}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'discover', label: 'Find Mentors' },
            ...(user?.role === 'alumni' ? [{ key: 'apply', label: 'Mentor Setup' }] : []),
            ...(canManageMentorRequests ? [{ key: 'requests', label: 'Requests' }] : []),
            { key: 'my', label: 'My Mentorships' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-sm shadow-primary-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-800 shadow-sm'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          activeTab === 'discover' ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <SkeletonList />
          )
        ) : activeTab === 'apply' && user?.role === 'alumni' ? (
          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Become a Mentor</h2>
                <p className="text-sm text-gray-500 mt-1">Share your expertise and guide the next generation</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Expertise</label>
                <input
                  type="text"
                  value={mentorForm.expertise}
                  onChange={(e) => setMentorForm({ ...mentorForm, expertise: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all"
                  placeholder="React, Node.js, Career Growth"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Availability</label>
                <input
                  type="text"
                  value={mentorForm.availability}
                  onChange={(e) => setMentorForm({ ...mentorForm, availability: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all"
                  placeholder="Weekends, 2 sessions/month"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Mentees</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={mentorForm.maxMentees}
                  onChange={(e) => setMentorForm({ ...mentorForm, maxMentees: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
                <textarea
                  value={mentorForm.bio}
                  onChange={(e) => setMentorForm({ ...mentorForm, bio: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all resize-none"
                  rows={4}
                  placeholder="Describe your experience and who you want to mentor"
                />
              </div>
              <button
                onClick={handleBecomeMentor}
                disabled={applying}
                className="w-full py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-medium rounded-xl transition-all duration-200 shadow-sm shadow-primary-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {applying ? 'Submitting...' : 'Submit Mentor Application'}
              </button>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
                <h3 className="font-bold text-gray-900">What Students Will See</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Your profile appears in ranked matches after admin approval. Students can request mentorship based on their skills, interests, and your expertise.
                </p>
              </div>
              <div className="bg-gradient-to-br from-primary-50/60 to-primary-50/30 rounded-2xl border border-primary-100 p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <AcademicCapIcon className="w-5 h-5 text-primary-600" />
                  <h3 className="font-bold text-gray-900 text-sm">Tips for a Great Profile</h3>
                </div>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5 shrink-0" />
                    Use commas to separate expertise topics for better matching
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5 shrink-0" />
                    Keep your bio focused on the support you provide
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5 shrink-0" />
                    Set a realistic max mentee count for quality sessions
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5 shrink-0" />
                    Mention specific industries or roles you can advise on
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ) : activeTab === 'discover' ? (
          <>
            <div className="relative max-w-md">
              <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm shadow-sm transition-all"
                placeholder="Search by skill, bio, or company..."
              />
            </div>

            {mentors.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {mentors.map(mentor => (
                  <div key={mentor._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all duration-200">
                    <CoverImage type="blog" className="w-full h-28" title={mentor.name} />
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 text-sm truncate">{mentor.name}</h3>
                          <p className="text-xs text-gray-500 truncate">
                            {[mentor.currentPosition, mentor.currentCompany].filter(Boolean).join(' at ') || 'Independent'}
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-primary-50 text-primary-700 text-xs font-semibold border border-primary-100 shrink-0">
                          {mentor.matchScore}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                        {mentor.mentorDetails?.bio || mentor.bio}
                      </p>
                      <div className="mb-3">
                        <p className="text-[11px] text-gray-400 font-medium mb-1.5 uppercase tracking-wider">Expertise</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(mentor.mentorDetails?.expertise || []).slice(0, 3).map((exp, i) => (
                            <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-lg text-[11px] font-medium">{exp}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[11px] text-gray-400">
                          <span className="font-medium text-gray-600">{mentor.mentorCapacity?.remainingSlots ?? 0}</span> slots available
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedMentor(mentor)}
                        className="w-full py-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-sm shadow-primary-200"
                      >
                        Request Mentorship
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <AcademicCapIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 text-sm font-medium">No mentors found</p>
                <p className="text-gray-400 text-xs mt-1">{search ? 'Try adjusting your search terms' : 'Check back later for new mentors'}</p>
              </div>
            )}

            {selectedMentor && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                onClick={() => setSelectedMentor(null)}
              >
                <div
                  className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-6"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-gray-900">Request Mentorship</h2>
                    <button
                      onClick={() => setSelectedMentor(null)}
                      className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mb-5">
                    To: <span className="font-semibold text-gray-900">{selectedMentor.name}</span>
                  </p>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Why do you want to be mentored?</label>
                  <textarea
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder="Tell them why you want to be mentored..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all resize-none mb-6"
                    rows={4}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleSendRequest}
                      className="flex-1 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-sm shadow-primary-200"
                    >
                      Send Request
                    </button>
                    <button
                      onClick={() => setSelectedMentor(null)}
                      className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
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
            {mentorRequests.length > 0 ? mentorRequests.map((request) => (
              <div key={request._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={request.mentee?.name} className="w-10 h-10" />
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900">{request.mentee?.name}</h3>
                      <p className="text-xs text-gray-500">{request.mentee?.college || 'Student'} &bull; {new Date(request.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRespondToRequest(request._id, 'accepted')}
                      className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white text-xs font-medium rounded-xl transition-all duration-200 shadow-sm shadow-emerald-200"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRespondToRequest(request._id, 'rejected')}
                      className="px-4 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="font-semibold text-xs text-gray-700 mb-1.5">Why they want mentorship</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{request.requestMessage}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="font-semibold text-xs text-gray-700 mb-1.5">Skills &amp; Goals</p>
                    <p className="text-xs text-gray-500">Skills: {(request.skills || []).join(', ') || 'Not provided'}</p>
                    <p className="text-xs text-gray-500 mt-1">Goals: {(request.goals || []).join(', ') || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <AcademicCapIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 text-sm font-medium">No pending requests</p>
                <p className="text-gray-400 text-xs mt-1">When students request mentorship, they will appear here</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {myMentorships.length > 0 ? myMentorships.map(m => (
              <div key={m._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.mentor?.name || m.mentee?.name} className="w-10 h-10" />
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900">{user?.role === 'alumni' ? m.mentee?.name : m.mentor?.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{m.requestMessage}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusBadge(m.status)}`}>
                    {m.status}
                  </span>
                </div>
              </div>
            )) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <AcademicCapIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 text-sm font-medium">No mentorships yet</p>
                <p className="text-gray-400 text-xs mt-1">Discover mentors and send a request to get started</p>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Mentorship;
