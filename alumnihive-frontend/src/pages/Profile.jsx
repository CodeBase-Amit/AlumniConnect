import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { usersAPI } from '../services/api';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { PencilIcon } from '@heroicons/react/24/outline';
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

  if (loading) return <MainLayout><div className="text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-[3px] border-primary-600 border-t-transparent mx-auto"></div></div></MainLayout>;
  if (!user) return <MainLayout><p className="text-center py-12 text-gray-400">User not found</p></MainLayout>;

  const isOwnProfile = userId === currentUser?._id;

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="card">
          <div className="flex flex-col sm:flex-row items-start gap-4 mb-4">
            <Avatar name={user.name} className="w-20 h-20 text-2xl ring-2 ring-gray-100" />
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-sm text-gray-500">{user.role} • {user.college}</p>
              {!isEditing && <p className="text-sm text-gray-600 mt-1">{user.bio}</p>}
            </div>
            {isOwnProfile && (
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(!isEditing)} className="btn-primary text-sm py-1.5 px-3"><PencilIcon className="w-4 h-4" /><span>Edit</span></button>
                <label className="inline-block cursor-pointer btn-secondary text-sm py-1.5 px-3">{avatarUploading ? '...' : 'Photo'}<input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={avatarUploading} /></label>
              </div>
            )}
          </div>

          {!isEditing ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[{ label: 'Department', value: user.department }, { label: 'Graduation Year', value: user.graduationYear }, { label: 'Position', value: user.currentPosition }, { label: 'Company', value: user.currentCompany }].map(i => (
                <div key={i.label}><p className="text-gray-400 text-xs">{i.label}</p><p className="font-medium text-gray-700">{i.value || 'N/A'}</p></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div><label className="input-label">Bio</label><textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} className="input-field" rows={3} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="input-label">LinkedIn</label><input type="url" value={formData.linkedin} onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })} className="input-field" /></div>
                <div><label className="input-label">GitHub</label><input type="url" value={formData.github} onChange={(e) => setFormData({ ...formData, github: e.target.value })} className="input-field" /></div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleSaveProfile} className="btn-primary flex-1">Save</button>
                <button onClick={() => setIsEditing(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="font-bold text-gray-900 mb-3">Skills</h2>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {formData.skills.map(skill => (
              <div key={skill} className="badge-primary text-xs flex items-center gap-1">
                <span>{skill}</span>
                {isEditing && <button onClick={() => removeSkill(skill)} className="text-xs font-bold cursor-pointer">&times;</button>}
              </div>
            ))}
          </div>
          {isEditing && (
            <div className="flex gap-2">
              <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="Add a skill..." className="input-field" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} />
              <button onClick={addSkill} className="btn-primary">Add</button>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="font-bold text-gray-900 mb-3">Communities ({user.communities?.length || 0})</h2>
          <div className="space-y-2">
            {user.communities?.slice(0, 5).map(community => (
              <div key={community._id} className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-lg">
                <Avatar name={community.name} className="w-7 h-7 text-[10px]" />
                <p className="font-medium text-sm text-gray-700">{community.name}</p>
              </div>
            ))}
          </div>
        </div>

        {(user.linkedin || user.github || user.portfolio) && (
          <div className="card">
            <h2 className="font-bold text-gray-900 mb-3">Social Links</h2>
            <div className="space-y-2">
              {[{ key: 'linkedin', label: 'LinkedIn' }, { key: 'github', label: 'GitHub' }, { key: 'portfolio', label: 'Portfolio' }].filter(l => user[l.key]).map(l => (
                <a key={l.key} href={user[l.key]} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-link">{l.label}</a>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Profile;
