import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { usersAPI, mentorshipAPI } from '../services/api';
import MentorshipChat from '../components/MentorshipChat';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import Avatar from '../components/Avatar';
import CoverImage from '../components/CoverImage';
import {
  AcademicCapIcon, MagnifyingGlassIcon, ShieldCheckIcon,
  XMarkIcon, CalendarIcon, ClockIcon, CheckCircleIcon,
  StarIcon, ChevronRightIcon, PlusIcon, UserGroupIcon,
  ChatBubbleLeftIcon, SparklesIcon, BriefcaseIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

const Mentorship = () => {
  const { user, refreshUser } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [allMentors, setAllMentors] = useState([]);
  const [myMentorships, setMyMentorships] = useState([]);
  const [mentorRequests, setMentorRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('discover');
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestTitle, setRequestTitle] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [search, setSearch] = useState('');
  const [expertiseFilter, setExpertiseFilter] = useState('');
  const [mentorForm, setMentorForm] = useState({ expertise: '', availability: '', maxMentees: 5, bio: '' });
  const [applying, setApplying] = useState(false);
  const [expandedMentorship, setExpandedMentorship] = useState(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionForm, setSessionForm] = useState({ title: '', description: '', scheduledAt: '', duration: 60 });
  const [sessionLoading, setSessionLoading] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [showEditSessionModal, setShowEditSessionModal] = useState(false);
  const [editSessionForm, setEditSessionForm] = useState({ title: '', description: '', scheduledAt: '', duration: 60 });
  const [editSessionMentorshipId, setEditSessionMentorshipId] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ rating: 0, comment: '' });
  const [feedbackMentorship, setFeedbackMentorship] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [showRateMenteeModal, setShowRateMenteeModal] = useState(false);
  const [rateMenteeForm, setRateMenteeForm] = useState({ rating: 0, comment: '' });
  const [rateMenteeMentorship, setRateMenteeMentorship] = useState(null);
  const [rateMenteeLoading, setRateMenteeLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => { loadData(); }, [activeTab, search, expertiseFilter]);

  const canManageMentorRequests = user?.role === 'alumni';

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'discover') {
        const res = await mentorshipAPI.getMentorMatches({ search: search || undefined, limit: 50 });
        setAllMentors(res.data.mentors);
        if (expertiseFilter) {
          setMentors(res.data.mentors.filter(m =>
            (m.mentorDetails?.expertise || []).some(e => e.toLowerCase().includes(expertiseFilter.toLowerCase()))
          ));
        } else {
          setMentors(res.data.mentors);
        }
      }
      if (activeTab === 'my' || activeTab === 'apply') {
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
    if (!requestTitle.trim()) { toast.error('Please provide a title'); return; }
    if (!requestMessage.trim()) { toast.error('Please provide a message'); return; }
    try {
      await mentorshipAPI.sendRequest({ mentorId: selectedMentor._id, requestMessage, title: requestTitle, description: requestDescription, goals: user?.interests || [], skills: user?.skills || [] });
      toast.success('Mentorship request sent!');
      setSelectedMentor(null);
      setRequestTitle('');
      setRequestDescription('');
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

  const handleAddSession = async (mentorshipId) => {
    if (!sessionForm.title.trim() || !sessionForm.scheduledAt) {
      toast.error('Title and date are required'); return;
    }
    try {
      setSessionLoading(true);
      await mentorshipAPI.addSession(mentorshipId, sessionForm);
      toast.success('Session scheduled!');
      setShowSessionModal(false);
      setSessionForm({ title: '', description: '', scheduledAt: '', duration: 60 });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to schedule session');
    } finally { setSessionLoading(false); }
  };

  const handleCompleteSession = async (mentorshipId, sessionId) => {
    const notes = window.prompt('Session notes (optional):')?.trim();
    try {
      await mentorshipAPI.completeSession(mentorshipId, sessionId, notes || '');
      toast.success('Session completed!');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete session');
    }
  };

  const handleEditSessionOpen = (mentorshipId, session) => {
    setEditSessionMentorshipId(mentorshipId);
    setEditingSession(session);
    setEditSessionForm({
      title: session.title || '',
      description: session.description || '',
      scheduledAt: session.scheduledAt ? new Date(new Date(session.scheduledAt).getTime() - new Date(session.scheduledAt).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
      duration: session.duration || 60,
    });
    setShowEditSessionModal(true);
  };

  const handleUpdateSession = async () => {
    if (!editSessionForm.title.trim() || !editSessionForm.scheduledAt) {
      toast.error('Title and date are required'); return;
    }
    try {
      setSessionLoading(true);
      await mentorshipAPI.updateSession(editSessionMentorshipId, editingSession._id, editSessionForm);
      toast.success('Session updated!');
      setShowEditSessionModal(false);
      setEditingSession(null);
      setEditSessionMentorshipId(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update session');
    } finally { setSessionLoading(false); }
  };

  const handleCancelSession = async (mentorshipId, sessionId, title) => {
    if (!window.confirm(`Cancel session "${title}"?`)) return;
    try {
      await mentorshipAPI.cancelSession(mentorshipId, sessionId);
      toast.success('Session cancelled');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel session');
    }
  };

  const handleCompleteMentorship = async (mentorshipId) => {
    if (!window.confirm('Mark this mentorship as completed?')) return;
    try {
      await mentorshipAPI.completeMentorship(mentorshipId);
      toast.success('Mentorship completed!');
      setExpandedMentorship(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete mentorship');
    }
  };

  const handleRateMentee = async () => {
    if (!rateMenteeForm.rating) { toast.error('Please select a rating'); return; }
    try {
      setRateMenteeLoading(true);
      await mentorshipAPI.rateMentee(rateMenteeMentorship._id, rateMenteeForm);
      toast.success('Rating submitted!');
      setShowRateMenteeModal(false);
      setRateMenteeForm({ rating: 0, comment: '' });
      setRateMenteeMentorship(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit rating');
    } finally { setRateMenteeLoading(false); }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackForm.rating) { toast.error('Please select a rating'); return; }
    try {
      setFeedbackLoading(true);
      await mentorshipAPI.addFeedback(feedbackMentorship._id, feedbackForm);
      toast.success('Feedback submitted!');
      setShowFeedbackModal(false);
      setFeedbackForm({ rating: 0, comment: '' });
      setFeedbackMentorship(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    } finally { setFeedbackLoading(false); }
  };

  const allExpertise = [...new Set(allMentors.flatMap(m => m.mentorDetails?.expertise || []))].slice(0, 10);

  const statusBadge = (status) => {
    switch (status) {
      case 'active': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'pending': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'accepted': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'completed': return 'bg-gray-50 text-gray-600 border border-gray-200';
      case 'rejected': return 'bg-red-50 text-red-700 border border-red-200';
      case 'scheduled': return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
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
            { key: 'discover', label: 'Find Mentors', icon: MagnifyingGlassIcon },
            ...(user?.role === 'alumni' ? [{ key: 'apply', label: 'Mentor Setup', icon: ShieldCheckIcon }] : []),
            ...(canManageMentorRequests ? [{ key: 'requests', label: 'Requests', icon: ChatBubbleLeftIcon }] : []),
            { key: 'my', label: 'My Mentorships', icon: AcademicCapIcon }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setExpandedMentorship(null); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 inline-flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-sm shadow-primary-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-800 shadow-sm'
              }`}
            >
              <tab.icon className="w-4 h-4" />
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
          <div className="space-y-6">
            {user.mentorDetails?.applicationStatus === 'approved' && myMentorships.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-50 rounded-xl"><UserGroupIcon className="w-5 h-5 text-blue-600" /></div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Mentees</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{myMentorships.filter(m => m.status === 'accepted' || m.status === 'active').length}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-emerald-50 rounded-xl"><CalendarIcon className="w-5 h-5 text-emerald-600" /></div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{myMentorships.reduce((sum, m) => sum + (m.sessions?.length || 0), 0)}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-50 rounded-xl"><CheckCircleIcon className="w-5 h-5 text-green-600" /></div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{myMentorships.reduce((sum, m) => sum + (m.sessions || []).filter(s => s.status === 'completed').length, 0)}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-amber-50 rounded-xl"><StarIcon className="w-5 h-5 text-amber-600" /></div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {(() => {
                      const ratings = myMentorships.flatMap(m => (m.feedback || []).map(f => f.rating)).filter(Boolean);
                      return ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '—';
                    })()}
                  </p>
                </div>
              </div>
            )}
            <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Become a Mentor</h2>
                <p className="text-sm text-gray-500 mt-1">Share your expertise and guide the next generation</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Expertise (comma separated)</label>
                <input type="text" value={mentorForm.expertise} onChange={(e) => setMentorForm({ ...mentorForm, expertise: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all" placeholder="React, Node.js, Career Growth" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Availability</label>
                <input type="text" value={mentorForm.availability} onChange={(e) => setMentorForm({ ...mentorForm, availability: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all" placeholder="Weekends, 2 sessions/month" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Mentees</label>
                <input type="number" min="1" max="50" value={mentorForm.maxMentees} onChange={(e) => setMentorForm({ ...mentorForm, maxMentees: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
                <textarea value={mentorForm.bio} onChange={(e) => setMentorForm({ ...mentorForm, bio: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all resize-none" rows={4} placeholder="Describe your experience and who you want to mentor" />
              </div>
              <button onClick={handleBecomeMentor} disabled={applying} className="w-full py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-medium rounded-xl transition-all duration-200 shadow-sm shadow-primary-200 disabled:opacity-50 disabled:cursor-not-allowed">
                {applying ? 'Submitting...' : 'Submit Mentor Application'}
              </button>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
                <h3 className="font-bold text-gray-900">What Students Will See</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Your profile appears in ranked matches after admin approval. Students can request mentorship based on their skills, interests, and your expertise.</p>
              </div>
              <div className="bg-gradient-to-br from-primary-50/60 to-primary-50/30 rounded-2xl border border-primary-100 p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <AcademicCapIcon className="w-5 h-5 text-primary-600" />
                  <h3 className="font-bold text-gray-900 text-sm">Tips for a Great Profile</h3>
                </div>
                <ul className="text-sm text-gray-500 space-y-2">
                  {['Use commas to separate expertise topics for better matching', 'Keep your bio focused on the support you provide', 'Set a realistic max mentee count for quality sessions', 'Mention specific industries or roles you can advise on'].map(tip => (
                    <li key={tip} className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5 shrink-0" />{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          </div>
        ) : activeTab === 'discover' ? (
          <>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm shadow-sm transition-all" placeholder="Search by skill, bio, or company..." />
              </div>
            </div>

            {allExpertise.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setExpertiseFilter('')} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${!expertiseFilter ? 'bg-primary-600 text-white shadow-sm shadow-primary-200' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>All</button>
                {allExpertise.map(exp => (
                  <button key={exp} onClick={() => setExpertiseFilter(exp)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${expertiseFilter === exp ? 'bg-primary-600 text-white shadow-sm shadow-primary-200' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>{exp}</button>
                ))}
              </div>
            )}

            {mentors.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {mentors.map(mentor => (
                  <div key={mentor._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all duration-200">
                    <CoverImage type="blog" className="w-full h-28" title={mentor.name} />
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 text-sm truncate">{mentor.name}</h3>
                          <p className="text-xs text-gray-500 truncate">{[mentor.currentPosition, mentor.currentCompany].filter(Boolean).join(' at ') || 'Independent'}</p>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-primary-50 text-primary-700 text-xs font-semibold border border-primary-100 shrink-0">{mentor.matchScore}%</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">{mentor.mentorDetails?.bio || mentor.bio}</p>
                      <div className="mb-3">
                        <p className="text-[11px] text-gray-400 font-medium mb-1.5 uppercase tracking-wider">Expertise</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(mentor.mentorDetails?.expertise || []).slice(0, 3).map((exp, i) => (
                            <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-lg text-[11px] font-medium">{exp}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[11px] text-gray-400"><span className="font-medium text-gray-600">{mentor.mentorCapacity?.remainingSlots ?? 0}</span> slots available</span>
                        {mentor.mentorDetails?.availability && <span className="text-[11px] text-gray-400 truncate ml-2">{mentor.mentorDetails.availability}</span>}
                      </div>
                      <button onClick={() => setSelectedMentor(mentor)} className="w-full py-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-sm shadow-primary-200">
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
                <p className="text-gray-400 text-xs mt-1">{search || expertiseFilter ? 'Try adjusting your filters' : 'Check back later for new mentors'}</p>
              </div>
            )}

            {selectedMentor && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedMentor(null)}>
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-gray-900">Request Mentorship</h2>
                      <button onClick={() => setSelectedMentor(null)} className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors"><XMarkIcon className="w-5 h-5 text-gray-500" /></button>
                    </div>
                    <div className="flex items-center gap-4">
                      <Avatar name={selectedMentor.name} className="w-14 h-14 text-lg ring-4 ring-primary-50" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900">{selectedMentor.name}</h3>
                        <p className="text-sm text-gray-500 truncate">{[selectedMentor.currentPosition, selectedMentor.currentCompany].filter(Boolean).join(' at ') || 'Independent'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-primary-50 text-primary-700 text-xs font-semibold">{selectedMentor.matchScore}% match</span>
                          {selectedMentor.mentorDetails?.availability && <span className="text-xs text-gray-400">{selectedMentor.mentorDetails.availability}</span>}
                        </div>
                      </div>
                    </div>
                    {selectedMentor.matchReasons?.length > 0 && (
                      <div className="mt-4 p-3 bg-primary-50/60 rounded-xl">
                        <p className="text-xs font-medium text-primary-700 mb-1.5 flex items-center gap-1"><SparklesIcon className="w-3.5 h-3.5" />Why this match?</p>
                        {selectedMentor.matchReasons.map((reason, i) => (
                          <p key={i} className="text-xs text-gray-600 flex items-center gap-1.5"><CheckCircleIcon className="w-3 h-3 text-primary-500 shrink-0" />{reason}</p>
                        ))}
                      </div>
                    )}
                    {(selectedMentor.mentorDetails?.expertise || []).length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Expertise</p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedMentor.mentorDetails?.expertise.map((exp, i) => (
                            <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">{exp}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedMentor.mentorDetails?.bio && (
                      <p className="text-sm text-gray-600 mt-4 leading-relaxed">{selectedMentor.mentorDetails.bio}</p>
                    )}
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Mentorship Title *</label>
                      <input type="text" value={requestTitle} onChange={(e) => setRequestTitle(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all" placeholder="e.g. Career Guidance in Software Engineering" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                      <textarea value={requestDescription} onChange={(e) => setRequestDescription(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all resize-none" rows={2} placeholder="Brief description of what you hope to achieve" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Why do you want to be mentored? *</label>
                      <textarea value={requestMessage} onChange={(e) => setRequestMessage(e.target.value)} placeholder="Tell them why you want to be mentored..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all resize-none" rows={2} />
                    </div>
                    <div className="flex gap-3">
                      <button onClick={handleSendRequest} className="flex-1 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-sm shadow-primary-200">Send Request</button>
                      <button onClick={() => setSelectedMentor(null)} className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                    </div>
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
                    <button onClick={() => handleRespondToRequest(request._id, 'accepted')} className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white text-xs font-medium rounded-xl transition-all duration-200 shadow-sm shadow-emerald-200">Accept</button>
                    <button onClick={() => handleRespondToRequest(request._id, 'rejected')} className="px-4 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-xl hover:bg-gray-50 transition-colors">Reject</button>
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
          <div className="space-y-4">
            {myMentorships.length > 0 ? myMentorships.map(m => (
              <div key={m._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => setExpandedMentorship(expandedMentorship === m._id ? null : m._id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.mentor?.name || m.mentee?.name} className="w-10 h-10" />
                      <div>
                        <h3 className="font-semibold text-sm text-gray-900">{user?.role === 'alumni' ? m.mentee?.name : m.mentor?.name}</h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(m.goals || []).slice(0, 2).map((goal, i) => (
                            <span key={i} className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-lg text-[10px] font-medium">{goal}</span>
                          ))}
                          {(m.skills || []).slice(0, 2).map((skill, i) => (
                            <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-medium">{skill}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusBadge(m.status)}`}>{m.status}</span>
                      <ChevronRightIcon className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expandedMentorship === m._id ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                </div>

                {expandedMentorship === m._id && (
                  <div className="border-t border-gray-100 bg-gray-50/40">
                    <div className="px-5 py-4 space-y-5">
                          {m.title && (
                            <div>
                              <h3 className="text-base font-bold text-gray-900">{m.title}</h3>
                              {m.description && <p className="text-sm text-gray-600 mt-1 leading-relaxed">{m.description}</p>}
                            </div>
                          )}

                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl border border-gray-100 p-4">
                              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-2">Mentor</p>
                              <div className="flex items-center gap-3">
                                <Avatar name={m.mentor?.name} className="w-10 h-10" />
                                <div>
                                  <p className="font-semibold text-sm text-gray-900">{m.mentor?.name || 'Unknown'}</p>
                                  {m.mentor?.currentCompany && <p className="text-xs text-gray-500">{m.mentor.currentCompany}</p>}
                                </div>
                              </div>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-100 p-4">
                              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-2">Mentee</p>
                              <div className="flex items-center gap-3">
                                <Avatar name={m.mentee?.name} className="w-10 h-10" />
                                <div>
                                  <p className="font-semibold text-sm text-gray-900">{m.mentee?.name || 'Unknown'}</p>
                                  {m.mentee?.college && <p className="text-xs text-gray-500">{m.mentee.college}</p>}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusBadge(m.status)}`}>{m.status}</span>
                            {m.startDate && <span>Started {new Date(m.startDate).toLocaleDateString()}</span>}
                            {m.endDate && <span>Ended {new Date(m.endDate).toLocaleDateString()}</span>}
                          </div>

                          {m.goals?.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-1"><CheckCircleIcon className="w-3.5 h-3.5" />Goals</p>
                              <div className="flex flex-wrap gap-1.5">
                                {m.goals.map((goal, i) => (
                                  <span key={i} className="px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium">{goal}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {m.sessions?.length > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1"><CalendarIcon className="w-3.5 h-3.5" />Sessions ({m.sessions.length})</p>
                              </div>
                              <div className="space-y-2">
                                {m.sessions.map(session => (
                                  <div key={session._id} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <p className="font-semibold text-sm text-gray-900">{session.title}</p>
                                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-medium ${statusBadge(session.status)}`}>{session.status}</span>
                                        </div>
                                        {session.description && <p className="text-xs text-gray-500 mb-1.5">{session.description}</p>}
                                        {session.notes && session.status === 'completed' && (
                                          <div className="mt-1.5 p-2 bg-gray-50 rounded-lg border border-gray-100">
                                            <p className="text-[11px] font-medium text-gray-500 mb-0.5">Session Notes</p>
                                            <p className="text-xs text-gray-700">{session.notes}</p>
                                          </div>
                                        )}
                                        <div className="flex items-center gap-3 text-xs text-gray-400">
                                          <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" />{new Date(session.scheduledAt).toLocaleDateString()}</span>
                                          <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3" />{new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                          {session.duration && <span>{session.duration}min</span>}
                                        </div>
                                      </div>
                                      {session.status === 'scheduled' && (
                                        <div className="flex gap-1 shrink-0">
                                          <button onClick={(e) => { e.stopPropagation(); handleEditSessionOpen(m._id, session); }} className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors cursor-pointer">Edit</button>
                                          <button onClick={(e) => { e.stopPropagation(); handleCancelSession(m._id, session._id, session.title); }} className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors cursor-pointer">Cancel</button>
                                          <button onClick={(e) => { e.stopPropagation(); handleCompleteSession(m._id, session._id); }} className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors cursor-pointer">Complete</button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {(m.status === 'accepted' || m.status === 'active') && user?.role === 'alumni' && (
                            <button onClick={() => { setSessionForm({ title: '', description: '', scheduledAt: '', duration: 60 }); setShowSessionModal(true); }} className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-primary-300 hover:text-primary-600 transition-colors font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer">
                              <PlusIcon className="w-4 h-4" />Schedule Session
                            </button>
                          )}

                          {(m.status === 'accepted' || m.status === 'active') && (
                            <button onClick={() => handleCompleteMentorship(m._id)} className="w-full py-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                              Mark Mentorship as Completed
                            </button>
                          )}

                          {m.status === 'completed' && (
                            <div className="text-center space-y-2">
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-medium"><CheckCircleIconSolid className="w-4 h-4" />Completed</div>
                              {user?.role === 'mentee' && !(m.feedback || []).some(f => f.from === user?._id || f.from === user?.id) && (
                                <button onClick={() => { setFeedbackMentorship(m); setFeedbackForm({ rating: 0, comment: '' }); setShowFeedbackModal(true); }} className="block w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-medium rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-sm shadow-amber-200 cursor-pointer">
                                  Leave Feedback
                                </button>
                              )}
                              {(m.feedback || []).some(f => f.from === user?._id || f.from === user?.id) && user?.role === 'mentee' && (
                                <p className="text-xs text-gray-400 flex items-center justify-center gap-1"><CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />Feedback submitted</p>
                              )}
                              {user?.role === 'alumni' && !(m.menteeFeedback || []).some(f => f.from === user?._id || f.from === user?.id) && (
                                <button onClick={() => { setRateMenteeMentorship(m); setRateMenteeForm({ rating: 0, comment: '' }); setShowRateMenteeModal(true); }} className="block w-full py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm shadow-blue-200 cursor-pointer">
                                  Rate Mentee
                                </button>
                              )}
                              {(m.menteeFeedback || []).some(f => f.from === user?._id || f.from === user?.id) && (
                                <p className="text-xs text-gray-400 flex items-center justify-center gap-1"><CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />Mentee rated</p>
                              )}
                            </div>
                          )}

                          <button onClick={() => setShowChat(!showChat)} className="w-full py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-medium rounded-xl hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shadow-sm shadow-indigo-200 inline-flex items-center justify-center gap-2 cursor-pointer">
                            <ChatBubbleLeftIcon className="w-4 h-4" />
                            {showChat ? 'Hide Chat' : 'Open Chat'}
                          </button>

                          {showChat && <MentorshipChat mentorship={m} onClose={() => setShowChat(false)} />}
                        </div>
                  </div>
                )}
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

        {showSessionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowSessionModal(false)}>
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">Schedule Session</h2>
                <button onClick={() => setShowSessionModal(false)} className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors"><XMarkIcon className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Session Title *</label>
                  <input type="text" value={sessionForm.title} onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all" placeholder="e.g. Career Planning Session" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea value={sessionForm.description} onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all resize-none" rows={2} placeholder="What will this session cover?" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date & Time *</label>
                  <input type="datetime-local" value={sessionForm.scheduledAt} onChange={(e) => setSessionForm({ ...sessionForm, scheduledAt: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (minutes)</label>
                  <input type="number" min="15" max="480" value={sessionForm.duration} onChange={(e) => setSessionForm({ ...sessionForm, duration: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all" />
                </div>
                <button onClick={() => handleAddSession(expandedMentorship)} disabled={sessionLoading} className="w-full py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-medium rounded-xl transition-all duration-200 shadow-sm shadow-primary-200 disabled:opacity-50 disabled:cursor-not-allowed">
                  {sessionLoading ? 'Scheduling...' : 'Schedule Session'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showEditSessionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowEditSessionModal(false)}>
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">Edit Session</h2>
                <button onClick={() => setShowEditSessionModal(false)} className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors"><XMarkIcon className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Session Title *</label>
                  <input type="text" value={editSessionForm.title} onChange={(e) => setEditSessionForm({ ...editSessionForm, title: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all" placeholder="e.g. Career Planning Session" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea value={editSessionForm.description} onChange={(e) => setEditSessionForm({ ...editSessionForm, description: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all resize-none" rows={2} placeholder="What will this session cover?" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date & Time *</label>
                  <input type="datetime-local" value={editSessionForm.scheduledAt} onChange={(e) => setEditSessionForm({ ...editSessionForm, scheduledAt: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (minutes)</label>
                  <input type="number" min="15" max="480" value={editSessionForm.duration} onChange={(e) => setEditSessionForm({ ...editSessionForm, duration: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all" />
                </div>
                <button onClick={handleUpdateSession} disabled={sessionLoading} className="w-full py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-medium rounded-xl transition-all duration-200 shadow-sm shadow-primary-200 disabled:opacity-50 disabled:cursor-not-allowed">
                  {sessionLoading ? 'Saving...' : 'Update Session'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showRateMenteeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowRateMenteeModal(false)}>
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">Rate Mentee</h2>
                <button onClick={() => setShowRateMenteeModal(false)} className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors"><XMarkIcon className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="space-y-5">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-3">Rate {rateMenteeMentorship?.mentee?.name}'s performance as a mentee</p>
                  <div className="flex items-center justify-center gap-1.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} onClick={() => setRateMenteeForm({ ...rateMenteeForm, rating: star })} className="p-1 cursor-pointer">
                        <StarIcon className={`w-8 h-8 transition-colors ${star <= rateMenteeForm.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Comment (optional)</label>
                  <textarea value={rateMenteeForm.comment} onChange={(e) => setRateMenteeForm({ ...rateMenteeForm, comment: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all resize-none" rows={3} placeholder="Share your thoughts..." />
                </div>
                <button onClick={handleRateMentee} disabled={rateMenteeLoading || !rateMenteeForm.rating} className="w-full py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-medium rounded-xl transition-all duration-200 shadow-sm shadow-primary-200 disabled:opacity-50 disabled:cursor-not-allowed">
                  {rateMenteeLoading ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showFeedbackModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowFeedbackModal(false)}>
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">Rate Your Mentorship</h2>
                <button onClick={() => setShowFeedbackModal(false)} className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors"><XMarkIcon className="w-5 h-5 text-gray-500" /></button>
              </div>
              <div className="space-y-5">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-3">How was your experience with {feedbackMentorship?.mentor?.name || feedbackMentorship?.mentee?.name}?</p>
                  <div className="flex items-center justify-center gap-1.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })} className="p-1 cursor-pointer">
                        <StarIcon className={`w-8 h-8 transition-colors ${star <= feedbackForm.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Comment (optional)</label>
                  <textarea value={feedbackForm.comment} onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm transition-all resize-none" rows={3} placeholder="Share your experience..." />
                </div>
                <button onClick={handleSubmitFeedback} disabled={feedbackLoading || !feedbackForm.rating} className="w-full py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-medium rounded-xl transition-all duration-200 shadow-sm shadow-primary-200 disabled:opacity-50 disabled:cursor-not-allowed">
                  {feedbackLoading ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Mentorship;
