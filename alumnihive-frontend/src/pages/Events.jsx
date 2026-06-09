import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout';
import CoverImage from '../components/CoverImage';
import { eventsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  ClockIcon,
  ChevronRightIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

const filterTabs = ['upcoming', 'ongoing', 'completed'];

const EventSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
    <div className="w-full h-40 bg-gray-200" />
    <div className="p-5 space-y-3">
      <div className="h-5 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
      <div className="space-y-2 pt-2">
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
      </div>
      <div className="flex gap-3 pt-2">
        <div className="h-9 bg-gray-200 rounded-lg w-full" />
        <div className="h-9 bg-gray-200 rounded-lg w-full" />
      </div>
    </div>
  </div>
);

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');
  const { user: currentUser } = useAuth();

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

  const isRegistered = (event) =>
    event.attendees?.some(
      (a) => a === currentUser?._id || a?._id === currentUser?._id
    );

  return (
    <MainLayout>
      <div className="space-y-6">
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

        <div className="relative">
          <div className="flex gap-1.5 bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 w-fit">
            {filterTabs.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`relative px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                  filter === f
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((n) => (
              <EventSkeleton key={n} />
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {events.map((event) => (
              <div
                key={event._id}
                className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-gray-200"
              >
                <div className="relative">
                  <CoverImage
                    type="event"
                    className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    title={event.title}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                </div>

                <div className="p-5 space-y-3">
                  <h3 className="font-bold text-gray-900 text-lg leading-snug group-hover:text-primary-700 transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">
                    {event.description}
                  </p>

                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <CalendarIcon className="w-4 h-4 text-primary-500 shrink-0" />
                      <span>
                        {new Date(event.startDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <ClockIcon className="w-4 h-4 text-primary-500 shrink-0 ml-1" />
                      <span>
                        {new Date(event.startDate).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPinIcon className="w-4 h-4 text-primary-500 shrink-0" />
                      <span>
                        {event.location?.type === 'online'
                          ? 'Online'
                          : `${event.location?.venue || ''}${event.location?.venue && event.location?.city ? ', ' : ''}${event.location?.city || ''}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <UsersIcon className="w-4 h-4 text-primary-500 shrink-0" />
                      <span>{event.attendees?.length || 0} attendees</span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Link
                      to={`/events/${event._id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-primary-700 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors"
                    >
                      Details
                      <ChevronRightIcon className="w-4 h-4" />
                    </Link>
                    {isRegistered(event) ? (
                      <button
                        disabled
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-xl cursor-default"
                      >
                        <UsersIcon className="w-4 h-4" />
                        Registered
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRegister(event._id)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 active:bg-primary-800 transition-colors"
                      >
                        Register
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <CalendarIcon className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">No {filter} events found</p>
            <p className="text-sm text-gray-400 mt-1">
              {filter === 'upcoming'
                ? 'Check back later for new events'
                : filter === 'ongoing'
                  ? 'No events happening right now'
                  : 'No past events to show'}
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Events;
