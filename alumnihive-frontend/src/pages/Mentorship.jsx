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

  return (
    <MainLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mentorship</h1>
          <p className="text-gray-500 text-sm mt-0.5">Discover mentors, apply as an alumni, and manage mentorships</p>
        </div>

        {user?.role === 'alumni' && (
          <div className="bg-primary-50/60 border border-primary-100 rounded-xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-2">
                <ShieldCheckIcon className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-primary-800 text-sm">Mentor application status</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {user.mentorDetails?.applicationStatus === 'approved'
                      ? 'Your mentor profile is active.'
                      : user.mentorDetails?.applicationStatus === 'pending'
                        ? 'Application under review.'
                        : user.mentorDetails?.applicationStatus === 'rejected'
                          ? `Rejected: ${user.mentorDetails?.rejectionReason || ''}`
                          : 'Submit your mentor profile to get started.'}
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500 text-right shrink-0">
                <p className="font-medium text-gray-700">Expertise</p>
                <p>{(user.mentorDetails?.expertise || []).join(', ') || 'None'}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 bg-white rounded-xl p-1.5 border border-gray-200 w-fit">
          {[
            { key: 'discover', label: 'Find Mentors' },
            ...(user?.role === 'alumni' ? [{ key: 'apply', label: 'Mentor Setup' }] : []),
            ...(canManageMentorRequests ? [{ key: 'requests', label: 'Requests' }] : []),
            { key: 'my', label: 'My Mentorships' }
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`tab text-xs ${activeTab === tab.key ? 'tab-active' : ''}`}
            >{tab.label}</button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-[3px] border-primary-600 border-t-transparent mx-auto"></div></div>
        ) : activeTab === 'apply' && user?.role === 'alumni' ? (
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="card space-y-4">
              <h2 className="font-bold text-gray-900">Become a mentor</h2>
              <div><label className="input-label">Expertise</label><input type="text" value={mentorForm.expertise} onChange={(e) => setMentorForm({ ...mentorForm, expertise: e.target.value })} className="input-field" placeholder="React, Node.js, Career Growth" /></div>
              <div><label className="input-label">Availability</label><input type="text" value={mentorForm.availability} onChange={(e) => setMentorForm({ ...mentorForm, availability: e.target.value })} className="input-field" placeholder="Weekends, 2 sessions/month" /></div>
              <div><label className="input-label">Max mentees</label><input type="number" min="1" max="50" value={mentorForm.maxMentees} onChange={(e) => setMentorForm({ ...mentorForm, maxMentees: Number(e.target.value) })} className="input-field" /></div>
              <div><label className="input-label">Bio</label><textarea value={mentorForm.bio} onChange={(e) => setMentorForm({ ...mentorForm, bio: e.target.value })} className="input-field" rows={4} placeholder="Describe your experience and who you want to mentor" /></div>
              <button onClick={handleBecomeMentor} disabled={applying} className="btn-primary w-full justify-center">{applying ? 'Submitting...' : 'Submit Mentor Application'}</button>
            </div>
            <div className="card space-y-3">
              <h3 className="font-bold text-gray-900">What students will see</h3>
              <p className="text-sm text-gray-500">Your profile appears in ranked matches after admin approval. Students can request mentorship based on their skills, interests, and your expertise.</p>
              <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500">
                <p className="font-medium text-gray-700 mb-1">Tips</p>
                <p>Use commas to separate expertise topics. Keep your bio focused on the support you provide.</p>
              </div>
            </div>
          </div>
        ) : activeTab === 'discover' ? (
          <>
            <div className="relative max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" placeholder="Search by skill, bio, or company" />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {mentors.map(mentor => (
                <div key={mentor._id} className="card-hover">
                  <CoverImage type="blog" className="w-full h-28 rounded-lg mb-3" title={mentor.name} />
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm">{mentor.name}</h3>
                      <p className="text-xs text-gray-500 truncate">{mentor.currentPosition} at {mentor.currentCompany || 'Independent'}</p>
                    </div>
                    <span className="badge-primary text-[11px] shrink-0">{mentor.matchScore}%</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">{mentor.mentorDetails?.bio || mentor.bio}</p>
                  <div className="mb-3">
                    <p className="text-[11px] text-gray-400 font-medium mb-1">Expertise:</p>
                    <div className="flex flex-wrap gap-1">{mentor.mentorDetails?.expertise?.slice(0, 3).map((exp, i) => <span key={i} className="badge-primary text-[11px]">{exp}</span>)}</div>
                  </div>
                  <p className="text-[11px] text-gray-400 mb-3">{(mentor.mentorCapacity?.remainingSlots ?? 0)} slots available</p>
                  <button onClick={() => setSelectedMentor(mentor)} className="btn-primary w-full text-sm justify-center">Request Mentorship</button>
                </div>
              ))}
            </div>

            {selectedMentor && (
              <div className="modal-overlay" onClick={() => setSelectedMentor(null)}>
                <div className="modal" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">Request Mentorship</h2>
                    <button onClick={() => setSelectedMentor(null)} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer"><XMarkIcon className="w-5 h-5 text-gray-500" /></button>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">To: <strong className="text-gray-900">{selectedMentor.name}</strong></p>
                  <textarea value={requestMessage} onChange={(e) => setRequestMessage(e.target.value)} placeholder="Tell them why you want to be mentored..." className="input-field mb-4" rows={4} />
                  <div className="flex gap-3">
                    <button onClick={handleSendRequest} className="btn-primary flex-1">Send Request</button>
                    <button onClick={() => setSelectedMentor(null)} className="btn-secondary flex-1">Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : activeTab === 'requests' && canManageMentorRequests ? (
          <div className="space-y-4">
            {mentorRequests.length > 0 ? mentorRequests.map((request) => (
              <div key={request._id} className="card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={request.mentee?.name} className="w-10 h-10" />
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900">{request.mentee?.name}</h3>
                      <p className="text-xs text-gray-500">{request.mentee?.college || 'Student'} • {new Date(request.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleRespondToRequest(request._id, 'accepted')} className="btn-primary text-xs px-3 py-1.5">Accept</button>
                    <button onClick={() => handleRespondToRequest(request._id, 'rejected')} className="btn-secondary text-xs px-3 py-1.5">Reject</button>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="font-semibold text-xs text-gray-700 mb-1">Why they want mentorship</p>
                    <p className="text-xs text-gray-500">{request.requestMessage}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="font-semibold text-xs text-gray-700 mb-1">Skills & Goals</p>
                    <p className="text-xs text-gray-500">Skills: {(request.skills || []).join(', ') || 'Not provided'}</p>
                    <p className="text-xs text-gray-500 mt-1">Goals: {(request.goals || []).join(', ') || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-12 text-gray-400"><AcademicCapIcon className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">No pending requests</p></div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {myMentorships.length > 0 ? myMentorships.map(m => (
              <div key={m._id} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.mentor?.name || m.mentee?.name} className="w-10 h-10" />
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900">{user?.role === 'alumni' ? m.mentee?.name : m.mentor?.name}</h3>
                      <p className="text-xs text-gray-500">{m.requestMessage}</p>
                    </div>
                  </div>
                  <span className={`badge-${m.status === 'active' ? 'accent' : 'yellow'} text-xs`}>{m.status}</span>
                </div>
              </div>
            )) : (
              <div className="text-center py-12 text-gray-400"><AcademicCapIcon className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">No mentorships yet</p></div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Mentorship;
