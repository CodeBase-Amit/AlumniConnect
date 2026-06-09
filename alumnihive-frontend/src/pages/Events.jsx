import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { eventsAPI } from '../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarIcon, MapPinIcon, PlusIcon, UsersIcon } from '@heroicons/react/24/outline';
import CoverImage from '../components/CoverImage';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');

  useEffect(() => {
    loadEvents();
  }, [filter]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const res = await eventsAPI.getEvents({ status: filter, limit: 20 });
      setEvents(res.data.events);
    } catch (error) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId) => {
    try {
      await eventsAPI.registerForEvent(eventId);
      toast.success('Registered for event!');
      loadEvents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Events</h1>
            <p className="text-gray-500 text-sm mt-0.5">Discover and join exciting events</p>
          </div>
          <Link to="/events/create" className="btn-primary shrink-0">
            <PlusIcon className="w-5 h-5" />
            <span>Create Event</span>
          </Link>
        </div>

        <div className="flex gap-2 bg-white rounded-xl p-1.5 border border-gray-200 w-fit">
          {['upcoming', 'ongoing', 'completed'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`tab text-xs ${filter === f ? 'tab-active' : ''}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-primary-600 border-t-transparent mx-auto"></div>
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {events.map(event => (
              <div key={event._id} className="card-hover">
                <CoverImage type="event" className="w-full h-36 rounded-lg mb-4" title={event.title} />
                <h3 className="font-bold text-gray-900 mb-1">{event.title}</h3>
                <p className="text-gray-500 text-sm line-clamp-2 mb-3">{event.description}</p>
                <div className="space-y-1.5 mb-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                    <span>{new Date(event.startDate).toLocaleDateString()} at {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPinIcon className="w-4 h-4 text-gray-400" />
                    <span>{event.location?.type === 'online' ? 'Online' : `${event.location?.venue || ''} ${event.location?.city || ''}`}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UsersIcon className="w-4 h-4 text-gray-400" />
                    <span>{event.attendees?.length || 0} attendees</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to={`/events/${event._id}`} className="btn-secondary flex-1 text-sm justify-center">View Details</Link>
                  <button onClick={() => handleRegister(event._id)} className="btn-primary flex-1 text-sm justify-center">Register</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No events found</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Events;
