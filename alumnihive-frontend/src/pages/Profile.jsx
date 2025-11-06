import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { usersAPI } from '../services/api';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { PencilIcon, LinkIcon } from '@heroicons/react/24/outline';

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const userId = id || currentUser?._id;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    skills: [],
    interests: [],
    linkedin: '',
    github: '',
    portfolio: ''
  });
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const res = await usersAPI.getUserById(userId);
      setUser(res.data.user);
      setFormData({
        name: res.data.user.name,
        bio: res.data.user.bio || '',
        skills: res.data.user.skills || [],
        interests: res.data.user.interests || [],
        linkedin: res.data.user.linkedin || '',
        github: res.data.user.github || '',
        portfolio: res.data.user.portfolio || ''
      });
    } catch (error) {
      toast.error('Failed to load user profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await usersAPI.updateProfile(formData);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      loadUser();
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput)) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput]
      });
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s !== skill)
    });
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

  if (!user) {
    return <MainLayout><p>User not found</p></MainLayout>;
  }

  const isOwnProfile = userId === currentUser?._id;

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header Card */}
        <div className="card">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-24 h-24 rounded-full"
              />
              <div>
                <h1 className="text-3xl font-bold">{user.name}</h1>
                <p className="text-gray-600">{user.role}</p>
                <p className="text-sm text-gray-500">{user.college}</p>
              </div>
            </div>
            {isOwnProfile && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="btn-primary flex items-center space-x-2"
              >
                <PencilIcon className="w-5 h-5" />
                <span>Edit</span>
              </button>
            )}
          </div>

          {!isEditing ? (
            <>
              <p className="text-gray-700 mb-4">{user.bio}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Department</p>
                  <p className="font-medium">{user.department || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Graduation Year</p>
                  <p className="font-medium">{user.graduationYear || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Current Position</p>
                  <p className="font-medium">{user.currentPosition || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Company</p>
                  <p className="font-medium">{user.currentCompany || 'N/A'}</p>
                </div>
              </div>
            </>
          ) : (
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="input-field"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">LinkedIn</label>
                <input
                  type="url"
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">GitHub</label>
                <input
                  type="url"
                  value={formData.github}
                  onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="btn-primary flex-1"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Skills */}
        <div className="card">
          <h2 className="font-bold text-lg mb-4">Skills</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {formData.skills.map(skill => (
              <div
                key={skill}
                className="flex items-center space-x-2 bg-primary-100 text-primary-700 px-3 py-1 rounded-full"
              >
                <span>{skill}</span>
                {isEditing && (
                  <button
                    onClick={() => removeSkill(skill)}
                    className="text-xs font-bold"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          {isEditing && (
            <div className="flex space-x-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Add a skill..."
                className="input-field flex-1"
              />
              <button
                onClick={addSkill}
                className="btn-primary"
              >
                Add
              </button>
            </div>
          )}
        </div>

        {/* Communities */}
        <div className="card">
          <h2 className="font-bold text-lg mb-4">Communities ({user.communities?.length || 0})</h2>
          <div className="space-y-2">
            {user.communities?.slice(0, 5).map(community => (
              <div key={community._id} className="p-3 bg-gray-50 rounded">
                <p className="font-medium">{community.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Social Links */}
        {(user.linkedin || user.github || user.portfolio) && (
          <div className="card">
            <h2 className="font-bold text-lg mb-4">Social Links</h2>
            <div className="space-y-2">
              {user.linkedin && (
                <a
                  href={user.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
                >
                  <LinkIcon className="w-4 h-4" />
                  <span>LinkedIn Profile</span>
                </a>
              )}
              {user.github && (
                <a
                  href={user.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
                >
                  <LinkIcon className="w-4 h-4" />
                  <span>GitHub Profile</span>
                </a>
              )}
              {user.portfolio && (
                <a
                  href={user.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
                >
                  <LinkIcon className="w-4 h-4" />
                  <span>Portfolio</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Profile;