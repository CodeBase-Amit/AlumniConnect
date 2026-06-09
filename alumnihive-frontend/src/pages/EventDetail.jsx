import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import MainLayout from '../components/Layout/MainLayout';
import { eventsAPI } from '../services/api';
import CoverImage from '../components/CoverImage';
import { useAuth } from '../contexts/AuthContext';
import {
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  ClockIcon,
  CheckBadgeIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/outline';

const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const CalendarSquare = ({ date }) => {
  const d = new Date(date);
  return (
    <div className="flex flex-col items-center bg-white rounded-xl border border-gray-200 w-16 h-16 shrink-0 shadow-sm">
      <span className="text-xs font-semibold text-gray-500 uppercase leading-tight pt-1.5">
        {monthNames[d.getMonth()]}
      </span>
      <span className="text-xl font-bold text-gray-900 leading-tight -mt-0.5">
        {d.getDate()}
      </span>
    </div>
  );
};

const DetailRow = ({ icon, label, children }) => (
  <div className="flex items-start gap-3">
    <div className="w-5 h-5 text-gray-400 mt-0.5 shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
      <div className="text-sm text-gray-800 mt-0.5">{children}</div>
    </div>
  </div>
);

const Skeleton = () => (
  <MainLayout>
    <div className="max-w-4xl mx-auto animate-pulse space-y-6">
      <div className="h-72 rounded-2xl bg-gray-200" />
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-8 w-3/4 bg-gray-200 rounded-lg" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-200 rounded" />
            <div className="h-4 w-5/6 bg-gray-200 rounded" />
            <div className="h-4 w-2/3 bg-gray-200 rounded" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-2.5 w-16 bg-gray-200 rounded" />
                  <div className="h-3.5 w-24 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-40 bg-gray-200 rounded-2xl" />
          <div className="h-12 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  </MainLayout>
);

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
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

  if (loading) return <Skeleton />;
  if (!event) return <MainLayout><p className="text-center py-12 text-gray-400">Event not found</p></MainLayout>;

  const isRegistered = currentUser && event.attendees?.some(
    (a) => (typeof a === 'string' ? a : a._id) === currentUser._id
  );

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <CoverImage type="event" className="w-full h-72 rounded-2xl" title={event.title} />

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mt-5 mb-4 group"
        >
          <ChevronLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                  {event.title}
                </h1>
                <span className={`badge shrink-0 capitalize text-xs font-semibold px-3 py-1 rounded-full ${
                  event.status === 'upcoming'
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                    : event.status === 'ongoing'
                    ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20'
                    : 'bg-gray-50 text-gray-600 ring-1 ring-gray-500/20'
                }`}>
                  {event.status}
                </span>
              </div>

              <p className="text-gray-600 leading-relaxed">{event.description}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                Event Details
              </h2>
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="flex items-center gap-3">
                  <CalendarSquare date={event.startDate} />
                  <div>
                    <DetailRow icon={<CalendarIcon className="w-full h-full" />} label="Starts">
                      {new Date(event.startDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </DetailRow>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CalendarSquare date={event.endDate} />
                  <div>
                    <DetailRow icon={<CalendarIcon className="w-full h-full" />} label="Ends">
                      {new Date(event.endDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </DetailRow>
                  </div>
                </div>

                <DetailRow icon={<ClockIcon className="w-full h-full" />} label="Time">
                  {new Date(event.startDate).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {' — '}
                  {new Date(event.endDate).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </DetailRow>

                <DetailRow icon={<MapPinIcon className="w-full h-full" />} label="Location">
                  {event.location?.type || 'TBD'}
                </DetailRow>

                <DetailRow icon={<UsersIcon className="w-full h-full" />} label="Attendees">
                  <span className="font-semibold text-gray-900">{event.attendees?.length || 0}</span>
                  {' '}registered
                </DetailRow>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Community
              </h3>
              <p className="text-gray-900 font-medium">{event.community?.name || 'General'}</p>

              <hr className="my-4 border-gray-100" />

              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Event Type
              </h3>
              <span className="inline-block bg-indigo-50 text-indigo-700 text-sm font-medium px-3 py-1 rounded-lg ring-1 ring-indigo-600/20">
                {event.eventType || 'General'}
              </span>
            </div>

            <button
              onClick={handleRegister}
              disabled={isRegistered}
              className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isRegistered
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 cursor-not-allowed'
                  : 'bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.97] shadow-sm'
              }`}
            >
              {isRegistered ? (
                <>
                  <CheckBadgeIcon className="w-5 h-5" />
                  Registered
                </>
              ) : (
                'Register For Event'
              )}
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default EventDetail;
