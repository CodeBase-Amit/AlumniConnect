import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import MainLayout from '../components/Layout/MainLayout';
import { eventsAPI, communitiesAPI } from '../services/api';
import { EVENT_TYPES } from '../utils/constants';
import CoverImage from '../components/CoverImage';
import { CalendarDaysIcon, PhotoIcon, TagIcon, MapPinIcon, UsersIcon, LinkIcon } from '@heroicons/react/24/outline';

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
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-200">
              <CalendarDaysIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Event</h1>
              <p className="text-gray-500 text-sm">Organize webinars, meetups and workshops for your community</p>
            </div>
          </div>
          <div className="h-1 w-20 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full mt-3"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 grid md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title *</label>
              <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-gray-900 placeholder-gray-400" value={formData.title} onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="Enter event title..." required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description *</label>
              <textarea className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-gray-900 placeholder-gray-400 resize-none" rows={4} value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Describe your event..." required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Community *</label>
              <div className="relative">
                <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-gray-900 appearance-none cursor-pointer" value={formData.community} onChange={(e) => setFormData(p => ({ ...p, community: e.target.value }))} required>
                  <option value="">Select community</option>{communities.map(item => <option key={item._id} value={item._id}>{item.name}</option>)}
                </select>
                <svg className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Event Type *</label>
              <div className="relative">
                <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-gray-900 appearance-none cursor-pointer" value={formData.eventType} onChange={(e) => setFormData(p => ({ ...p, eventType: e.target.value }))} required>
                  {EVENT_TYPES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
                <svg className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Date *</label>
              <input type="datetime-local" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-gray-900" value={formData.startDate} onChange={(e) => setFormData(p => ({ ...p, startDate: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">End Date *</label>
              <input type="datetime-local" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-gray-900" value={formData.endDate} onChange={(e) => setFormData(p => ({ ...p, endDate: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location Type</label>
              <div className="relative">
                <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-gray-900 appearance-none cursor-pointer" value={formData.locationType} onChange={(e) => setFormData(p => ({ ...p, locationType: e.target.value }))}>
                  <option value="online">Online</option><option value="offline">Offline</option><option value="hybrid">Hybrid</option>
                </select>
                <svg className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Max Attendees</label>
              <div className="relative">
                <input type="number" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-gray-900 placeholder-gray-400 pl-10" value={formData.maxAttendees} onChange={(e) => setFormData(p => ({ ...p, maxAttendees: e.target.value }))} placeholder="Unlimited" />
                <UsersIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Venue</label>
              <div className="relative">
                <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-gray-900 placeholder-gray-400 pl-10" value={formData.locationVenue} onChange={(e) => setFormData(p => ({ ...p, locationVenue: e.target.value }))} placeholder="Venue name" />
                <MapPinIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">City</label>
              <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-gray-900 placeholder-gray-400" value={formData.locationCity} onChange={(e) => setFormData(p => ({ ...p, locationCity: e.target.value }))} placeholder="City" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Address</label>
              <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-gray-900 placeholder-gray-400" value={formData.locationAddress} onChange={(e) => setFormData(p => ({ ...p, locationAddress: e.target.value }))} placeholder="Full address" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Meeting Link</label>
              <div className="relative">
                <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-gray-900 placeholder-gray-400 pl-10" value={formData.locationMeetingLink} onChange={(e) => setFormData(p => ({ ...p, locationMeetingLink: e.target.value }))} placeholder="https://meet.google.com/..." />
                <LinkIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tags</label>
              <div className="relative">
                <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-gray-900 placeholder-gray-400 pl-10" placeholder="career, networking" value={formData.tags} onChange={(e) => setFormData(p => ({ ...p, tags: e.target.value }))} />
                <TagIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Event Cover Image</label>
            <div className="relative">
              <input type="file" accept="image/*" className="hidden" id="event-cover-upload" onChange={(e) => {
                const file = e.target.files?.[0]; if (!file) return;
                setCoverFile(file); setCoverPreview(URL.createObjectURL(file));
              }} />
              <label htmlFor="event-cover-upload" className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary-400 hover:bg-primary-50/30 cursor-pointer transition-all">
                <PhotoIcon className="w-8 h-8 text-gray-300 mb-1" />
                <span className="text-sm text-gray-400 font-medium">Click to upload event cover</span>
                <span className="text-xs text-gray-300 mt-0.5">PNG, JPG, WEBP</span>
              </label>
            </div>
            <p className="text-xs text-gray-400">Optional: or use URL</p>
            <div className="relative">
              <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-gray-900 placeholder-gray-400 pl-10" placeholder="https://example.com/cover.jpg" value={formData.coverImage} onChange={(e) => setFormData(p => ({ ...p, coverImage: e.target.value }))} />
              <PhotoIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            {(coverPreview || formData.coverImage) && (
              <div className="mt-2">
                <CoverImage type="event" className="h-44 w-full rounded-xl object-cover shadow-sm" title="Cover preview" />
              </div>
            )}
          </div>

          <button disabled={loading} className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold text-sm shadow-lg shadow-primary-200 hover:shadow-xl hover:shadow-primary-300 hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
            {loading ? (
              <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Creating...</>
            ) : 'Create Event'}
          </button>
        </form>
      </div>
    </MainLayout>
  );
};

export default CreateEvent;
