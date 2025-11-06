import { useEffect, useState } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { eventsAPI } from '../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarIcon, MapPinIcon, PlusIcon, UsersIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

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
      const res = await eventsAPI.getEvents({
        status: filter === 'upcoming' ? 'upcoming' : filter === 'ongoing' ? 'ongoing' : 'completed',
        limit: 20
      });
      setEvents(res.data.events);
    } catch (error) {
      toast.error('Failed to load events');
      console.error(error);
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Events</h1>
            <p className="text-gray-600 mt-1">Discover and join exciting events happening in your community</p>
          </div>
          <Link to="/events/create" className="btn-primary flex items-center space-x-2">
            <PlusIcon className="w-5 h-5" />
            <span>Create Event</span>
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-4 border-b border-gray-200">
          {['upcoming', 'ongoing', 'completed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-3 font-medium border-b-2 transition ${
                filter === f
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map(event => (
              <div key={event._id} className="card hover:shadow-lg transition">
                <img
                  src={event.coverImage || 'https://via.placeholder.com/400x200'}
                  alt={event.title}
                  className="w-full h-40 object-cover rounded-lg mb-4"
                />
                <h3 className="font-bold text-lg mb-2">{event.title}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.description}</p>

                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="w-4 h-4" />
                    <span>
                      {new Date(event.startDate).toLocaleDateString()} - {new Date(event.startDate).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPinIcon className="w-4 h-4" />
                    <span>
                      {event.location.type === 'online' ? 'Online' : `${event.location.venue}, ${event.location.city}`}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <UsersIcon className="w-4 h-4" />
                    <span>{event.attendees?.length || 0} attendees</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Link
                    to={`/events/${event._id}`}
                    className="btn-secondary flex-1 text-center text-sm"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => handleRegister(event._id)}
                    className="btn-primary flex-1 text-sm"
                  >
                    Register
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12 text-gray-500">
            <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No events found</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Events;