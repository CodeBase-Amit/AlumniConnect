import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { usersAPI } from '../services/api';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { PencilIcon, LinkIcon, GlobeAltIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import Avatar from '../components/Avatar';
import CoverImage from '../components/CoverImage';

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser, refreshUser } = useAuth();
  const userId = id || currentUser?._id;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', bio: '', skills: [], interests: [], linkedin: '', github: '', portfolio: '' });
  const [skillInput, setSkillInput] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => { loadUser(); }, [userId]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const res = await usersAPI.getUserById(userId);
      setUser(res.data.user);
      setFormData({
        name: res.data.user.name, bio: res.data.user.bio || '',
        skills: res.data.user.skills || [], interests: res.data.user.interests || [],
        linkedin: res.data.user.linkedin || '', github: res.data.user.github || '',
        portfolio: res.data.user.portfolio || ''
      });
    } catch (error) { toast.error('Failed to load profile'); } finally { setLoading(false); }
  };

  const handleSaveProfile = async () => {
    try { await usersAPI.updateProfile(formData); toast.success('Profile updated!'); setIsEditing(false); loadUser(); }
    catch (error) { toast.error('Failed to update profile'); }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formPayload = new FormData();
    formPayload.append('avatar', file);
    try {
      setAvatarUploading(true);
      await usersAPI.updateProfilePhoto(formPayload);
      toast.success('Profile photo updated');
      await refreshUser();
      loadUser();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to upload'); } finally { setAvatarUploading(false); }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput)) {
      setFormData({ ...formData, skills: [...formData.skills, skillInput] });
      setSkillInput('');
    }
  };
  const removeSkill = (skill) => setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });

  if (loading) return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6 pb-8">
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 animate-pulse">
          <div className="flex items-start gap-5">
            <div className="w-24 h-24 rounded-full bg-gray-100 shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-6 bg-gray-100 rounded w-48" />
              <div className="h-4 bg-gray-100 rounded w-36" />
              <div className="h-4 bg-gray-100 rounded w-64" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 bg-gray-100 rounded w-16" />
                <div className="h-4 bg-gray-100 rounded w-28" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 animate-pulse">
          <div className="h-5 bg-gray-100 rounded w-20 mb-4" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-7 bg-gray-100 rounded-full w-16" />)}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 animate-pulse">
          <div className="h-5 bg-gray-100 rounded w-32 mb-4" />
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100" />
                <div className="h-4 bg-gray-100 rounded w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
  if (!user) return <MainLayout><p className="text-center py-12 text-gray-400">User not found</p></MainLayout>;

  const isOwnProfile = userId === currentUser?._id;

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6 pb-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="shrink-0">
              <Avatar name={user.name} className="w-24 h-24 text-3xl ring-4 ring-primary-50" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {user.role} {user.college ? <><span className="text-gray-300 mx-1.5">•</span>{user.college}</> : ''}
                  </p>
                  {!isEditing && user.bio && (
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">{user.bio}</p>
                  )}
                </div>
                {isOwnProfile && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
                    >
                      <PencilIcon className="w-4 h-4" />
                      <span>{isEditing ? 'Cancel' : 'Edit'}</span>
                    </button>
                    <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors shadow-sm">
                      {avatarUploading ? (
                        <span className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <PencilIcon className="w-4 h-4 text-gray-500" />
                      )}
                      <span>Photo</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={avatarUploading} />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {!isEditing ? (
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
              {[
                { label: 'Department', value: user.department },
                { label: 'Graduation Year', value: user.graduationYear },
                { label: 'Position', value: user.currentPosition },
                { label: 'Company', value: user.currentCompany }
              ].map(i => (
                <div key={i.label} className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{i.label}</p>
                  <p className="font-semibold text-gray-800">{i.value || 'N/A'}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 mt-6 pt-6 border-t border-gray-100">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all resize-none"
                  rows={3}
                  placeholder="Tell us about yourself..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">LinkedIn</label>
                  <input
                    type="url"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">GitHub</label>
                  <input
                    type="url"
                    value={formData.github}
                    onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                    placeholder="https://github.com/..."
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSaveProfile} className="flex-1 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors">Save Changes</button>
                <button onClick={() => setIsEditing(false)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Skills Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Skills</h2>
            {formData.skills.length > 0 && <span className="text-xs text-gray-400 font-medium">{formData.skills.length} skills</span>}
          </div>
          {formData.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {formData.skills.map(skill => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 text-sm font-medium rounded-full"
                >
                  {skill}
                  {isEditing && (
                    <button
                      onClick={() => removeSkill(skill)}
                      className="w-4 h-4 rounded-full bg-primary-200 hover:bg-primary-300 text-primary-700 flex items-center justify-center text-xs font-bold transition-colors"
                    >
                      &times;
                    </button>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">No skills added yet</p>
          )}
          {isEditing && (
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Add a skill..."
                className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
              />
              <button onClick={addSkill} className="px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors">Add</button>
            </div>
          )}
        </div>

        {/* Communities Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Communities</h2>
            {user.communities?.length > 0 && <span className="text-xs text-gray-400 font-medium">{user.communities.length} joined</span>}
          </div>
          {user.communities?.length > 0 ? (
            <div className="space-y-2">
              {user.communities.slice(0, 5).map(community => (
                <a
                  key={community._id}
                  href={`/communities/${community._id}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                >
                  <Avatar name={community.name} className="w-9 h-9 text-xs ring-2 ring-white" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800 group-hover:text-primary-600 transition-colors">{community.name}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">No communities joined yet</p>
          )}
        </div>

        {/* Social Links Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Social Links</h2>
          {user.linkedin || user.github || user.portfolio ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {user.linkedin && (
                <a
                  href={user.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all border border-transparent group"
                >
                  <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                    <LinkIcon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                  <span className="font-medium text-sm text-gray-700 group-hover:text-blue-600 transition-colors">LinkedIn</span>
                </a>
              )}
              {user.github && (
                <a
                  href={user.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all border border-transparent group"
                >
                  <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                    <GlobeAltIcon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                  <span className="font-medium text-sm text-gray-700 group-hover:text-gray-900 transition-colors">GitHub</span>
                </a>
              )}
              {user.portfolio && (
                <a
                  href={user.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all border border-transparent group"
                >
                  <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                    <BriefcaseIcon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                  <span className="font-medium text-sm text-gray-700 group-hover:text-emerald-600 transition-colors">Portfolio</span>
                </a>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">No social links added</p>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile;
