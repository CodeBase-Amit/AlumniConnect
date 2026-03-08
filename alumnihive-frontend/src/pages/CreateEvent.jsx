import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import MainLayout from '../components/Layout/MainLayout';
import { eventsAPI, communitiesAPI } from '../services/api';
import { EVENT_TYPES, resolveMediaUrl } from '../utils/constants';

const CreateEvent = () => {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    community: '',
    eventType: 'workshop',
    startDate: '',
    endDate: '',
    locationType: 'online',
    locationVenue: '',
    locationAddress: '',
    locationCity: '',
    locationMeetingLink: '',
    maxAttendees: '',
    tags: '',
    coverImage: ''
  });

  useEffect(() => {
    const loadCommunities = async () => {
      try {
        const response = await communitiesAPI.getCommunities({ limit: 200 });
        setCommunities(response.data.communities || []);
      } catch (error) {
        toast.error('Failed to load communities');
      }
    };

    loadCommunities();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.title || !formData.description || !formData.community || !formData.startDate || !formData.endDate) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);

      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== undefined && value !== null) {
          payload.append(key, value);
        }
      });

      if (coverFile) {
        payload.append('coverImage', coverFile);
      }

      const response = await eventsAPI.createEvent(payload);
      toast.success('Event created successfully');
      navigate(`/events/${response.data.event._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Create Event</h1>
          <p className="text-gray-600 mt-1">Organize webinars, meetups and workshops for your community.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                className="input-field"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Description *</label>
              <textarea
                className="input-field"
                rows="5"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Community *</label>
              <select
                className="input-field"
                value={formData.community}
                onChange={(e) => setFormData((prev) => ({ ...prev, community: e.target.value }))}
                required
              >
                <option value="">Select community</option>
                {communities.map((item) => (
                  <option key={item._id} value={item._id}>{item.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Event Type *</label>
              <select
                className="input-field"
                value={formData.eventType}
                onChange={(e) => setFormData((prev) => ({ ...prev, eventType: e.target.value }))}
                required
              >
                {EVENT_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Start Date *</label>
              <input
                type="datetime-local"
                className="input-field"
                value={formData.startDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">End Date *</label>
              <input
                type="datetime-local"
                className="input-field"
                value={formData.endDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Location Type</label>
              <select
                className="input-field"
                value={formData.locationType}
                onChange={(e) => setFormData((prev) => ({ ...prev, locationType: e.target.value }))}
              >
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Max Attendees</label>
              <input
                type="number"
                className="input-field"
                value={formData.maxAttendees}
                onChange={(e) => setFormData((prev) => ({ ...prev, maxAttendees: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Venue</label>
              <input
                className="input-field"
                value={formData.locationVenue}
                onChange={(e) => setFormData((prev) => ({ ...prev, locationVenue: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input
                className="input-field"
                value={formData.locationCity}
                onChange={(e) => setFormData((prev) => ({ ...prev, locationCity: e.target.value }))}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Address</label>
              <input
                className="input-field"
                value={formData.locationAddress}
                onChange={(e) => setFormData((prev) => ({ ...prev, locationAddress: e.target.value }))}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Meeting Link</label>
              <input
                className="input-field"
                value={formData.locationMeetingLink}
                onChange={(e) => setFormData((prev) => ({ ...prev, locationMeetingLink: e.target.value }))}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Tags</label>
              <input
                className="input-field"
                placeholder="career, networking, placement"
                value={formData.tags}
                onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
            <label className="block text-sm font-medium">Event Cover Image</label>
            <input
              type="file"
              accept="image/*"
              className="w-full text-sm"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) {
                  return;
                }
                setCoverFile(file);
                setCoverPreview(URL.createObjectURL(file));
              }}
            />
            <p className="text-xs text-gray-500">Optional: you can also use URL below.</p>
            <input
              className="input-field"
              placeholder="https://example.com/cover.jpg"
              value={formData.coverImage}
              onChange={(e) => setFormData((prev) => ({ ...prev, coverImage: e.target.value }))}
            />
            {(coverPreview || formData.coverImage) && (
              <img
                src={coverPreview || resolveMediaUrl(formData.coverImage)}
                className="h-56 w-full object-cover rounded-lg"
                alt="Event preview"
              />
            )}
          </div>

          <button disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Creating event...' : 'Create Event'}
          </button>
        </form>
      </div>
    </MainLayout>
  );
};

export default CreateEvent;
