import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import MainLayout from '../components/Layout/MainLayout';
import { eventsAPI } from '../services/api';
import { resolveMediaUrl } from '../utils/constants';

const EventDetail = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const response = await eventsAPI.getEventById(id);
        setEvent(response.data.event);
      } catch (error) {
        toast.error('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [id]);

  const handleRegister = async () => {
    try {
      await eventsAPI.registerForEvent(id);
      toast.success('Registered successfully');
      const response = await eventsAPI.getEventById(id);
      setEvent(response.data.event);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-16">Loading event...</div>
      </MainLayout>
    );
  }

  if (!event) {
    return (
      <MainLayout>
        <div className="text-center py-16">Event not found</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <img
          src={resolveMediaUrl(event.coverImage || 'https://via.placeholder.com/800x360')}
          alt={event.title}
          className="w-full h-80 object-cover rounded-xl"
        />

        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-bold">{event.title}</h1>
            <span className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded-full capitalize">{event.status}</span>
          </div>

          <p className="text-gray-700">{event.description}</p>

          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <p><span className="font-semibold">Community:</span> {event.community?.name}</p>
            <p><span className="font-semibold">Type:</span> {event.eventType}</p>
            <p><span className="font-semibold">Starts:</span> {new Date(event.startDate).toLocaleString()}</p>
            <p><span className="font-semibold">Ends:</span> {new Date(event.endDate).toLocaleString()}</p>
            <p><span className="font-semibold">Location:</span> {event.location?.type}</p>
            <p><span className="font-semibold">Attendees:</span> {event.attendees?.length || 0}</p>
          </div>

          <button onClick={handleRegister} className="btn-primary w-full py-3">Register For Event</button>
        </div>
      </div>
    </MainLayout>
  );
};

export default EventDetail;
