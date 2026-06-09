import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import MainLayout from '../components/Layout/MainLayout';
import { eventsAPI } from '../services/api';
import CoverImage from '../components/CoverImage';
import { CalendarIcon, MapPinIcon, UsersIcon } from '@heroicons/react/24/outline';

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

  if (loading) return <MainLayout><div className="text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-[3px] border-primary-600 border-t-transparent mx-auto"></div></div></MainLayout>;
  if (!event) return <MainLayout><p className="text-center py-12 text-gray-400">Event not found</p></MainLayout>;

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-5">
        <CoverImage type="event" className="w-full h-64 rounded-xl" title={event.title} />

        <div className="card space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{event.title}</h1>
            <span className="badge-primary capitalize text-xs">{event.status}</span>
          </div>

          <p className="text-gray-600">{event.description}</p>

          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <CalendarIcon className="w-4 h-4 text-gray-400" />
              <span><span className="font-medium text-gray-700">Starts:</span> {new Date(event.startDate).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <CalendarIcon className="w-4 h-4 text-gray-400" />
              <span><span className="font-medium text-gray-700">Ends:</span> {new Date(event.endDate).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <MapPinIcon className="w-4 h-4 text-gray-400" />
              <span><span className="font-medium text-gray-700">Location:</span> {event.location?.type}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <UsersIcon className="w-4 h-4 text-gray-400" />
              <span><span className="font-medium text-gray-700">Attendees:</span> {event.attendees?.length || 0}</span>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">Community:</span> {event.community?.name} &nbsp;|&nbsp;
            <span className="font-medium text-gray-700">Type:</span> {event.eventType}
          </div>

          <button onClick={handleRegister} className="btn-primary w-full justify-center">Register For Event</button>
        </div>
      </div>
    </MainLayout>
  );
};

export default EventDetail;
