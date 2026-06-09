import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import MainLayout from '../components/Layout/MainLayout';
import { eventsAPI, communitiesAPI } from '../services/api';
import { EVENT_TYPES } from '../utils/constants';
import CoverImage from '../components/CoverImage';

const CreateEvent = () => {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', community: '', eventType: 'workshop',
    startDate: '', endDate: '', locationType: 'online', locationVenue: '',
    locationAddress: '', locationCity: '', locationMeetingLink: '',
    maxAttendees: '', tags: '', coverImage: ''
  });

  useEffect(() => {
    const loadCommunities = async () => {
      try {
        const response = await communitiesAPI.getCommunities({ limit: 200 });
        setCommunities(response.data.communities || []);
      } catch (error) { toast.error('Failed to load communities'); }
    };
    loadCommunities();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.title || !formData.description || !formData.community || !formData.startDate || !formData.endDate) {
      toast.error('Please fill all required fields'); return;
    }
    try {
      setLoading(true);
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== undefined && value !== null) payload.append(key, value);
      });
      if (coverFile) payload.append('coverImage', coverFile);
      const response = await eventsAPI.createEvent(payload);
      toast.success('Event created successfully');
      navigate(`/events/${response.data.event._id}`);
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to create event'); } finally { setLoading(false); }
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Event</h1>
          <p className="text-gray-500 text-sm mt-0.5">Organize webinars, meetups and workshops for your community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="card grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><label className="input-label">Title *</label><input className="input-field" value={formData.title} onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))} required /></div>
            <div className="md:col-span-2"><label className="input-label">Description *</label><textarea className="input-field" rows={4} value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} required /></div>
            <div><label className="input-label">Community *</label><select className="select-field" value={formData.community} onChange={(e) => setFormData(p => ({ ...p, community: e.target.value }))} required>
              <option value="">Select community</option>{communities.map(item => <option key={item._id} value={item._id}>{item.name}</option>)}</select></div>
            <div><label className="input-label">Event Type *</label><select className="select-field" value={formData.eventType} onChange={(e) => setFormData(p => ({ ...p, eventType: e.target.value }))} required>
              {EVENT_TYPES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
            <div><label className="input-label">Start Date *</label><input type="datetime-local" className="input-field" value={formData.startDate} onChange={(e) => setFormData(p => ({ ...p, startDate: e.target.value }))} required /></div>
            <div><label className="input-label">End Date *</label><input type="datetime-local" className="input-field" value={formData.endDate} onChange={(e) => setFormData(p => ({ ...p, endDate: e.target.value }))} required /></div>
            <div><label className="input-label">Location Type</label><select className="select-field" value={formData.locationType} onChange={(e) => setFormData(p => ({ ...p, locationType: e.target.value }))}>
              <option value="online">Online</option><option value="offline">Offline</option><option value="hybrid">Hybrid</option></select></div>
            <div><label className="input-label">Max Attendees</label><input type="number" className="input-field" value={formData.maxAttendees} onChange={(e) => setFormData(p => ({ ...p, maxAttendees: e.target.value }))} /></div>
            <div><label className="input-label">Venue</label><input className="input-field" value={formData.locationVenue} onChange={(e) => setFormData(p => ({ ...p, locationVenue: e.target.value }))} /></div>
            <div><label className="input-label">City</label><input className="input-field" value={formData.locationCity} onChange={(e) => setFormData(p => ({ ...p, locationCity: e.target.value }))} /></div>
            <div className="md:col-span-2"><label className="input-label">Address</label><input className="input-field" value={formData.locationAddress} onChange={(e) => setFormData(p => ({ ...p, locationAddress: e.target.value }))} /></div>
            <div className="md:col-span-2"><label className="input-label">Meeting Link</label><input className="input-field" value={formData.locationMeetingLink} onChange={(e) => setFormData(p => ({ ...p, locationMeetingLink: e.target.value }))} /></div>
            <div className="md:col-span-2"><label className="input-label">Tags</label><input className="input-field" placeholder="career, networking" value={formData.tags} onChange={(e) => setFormData(p => ({ ...p, tags: e.target.value }))} /></div>
          </div>

          <div className="card space-y-3">
            <label className="input-label">Event Cover Image</label>
            <input type="file" accept="image/*" className="w-full text-sm" onChange={(e) => {
              const file = e.target.files?.[0]; if (!file) return;
              setCoverFile(file); setCoverPreview(URL.createObjectURL(file));
            }} />
            <p className="text-xs text-gray-400">Optional: or use URL</p>
            <input className="input-field" placeholder="https://example.com/cover.jpg" value={formData.coverImage} onChange={(e) => setFormData(p => ({ ...p, coverImage: e.target.value }))} />
            {(coverPreview || formData.coverImage) && <CoverImage type="event" className="h-40 w-full rounded-lg" title="Cover preview" />}
          </div>

          <button disabled={loading} className="btn-primary w-full justify-center">{loading ? 'Creating...' : 'Create Event'}</button>
        </form>
      </div>
    </MainLayout>
  );
};

export default CreateEvent;
