import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { CheckCircleIcon, XCircleIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      if (!token) { setStatus('error'); setMessage('No verification token provided'); setLoading(false); return; }
      try {
        const res = await authAPI.verifyEmail(token);
        setStatus('success');
        setMessage(res.data.message || 'Email verified successfully!');
        toast.success('Email verified!');
        setTimeout(() => navigate('/login'), 3000);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification failed');
        toast.error(error.response?.data?.message || 'Verification failed');
      } finally { setLoading(false); }
    };
    verify();
  }, [token, navigate]);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center">
      <div className="text-center">
        <div className="relative mx-auto mb-6 w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-600 animate-spin"></div>
          <EnvelopeIcon className="w-6 h-6 text-primary-500 absolute inset-0 m-auto" />
        </div>
        <p className="text-gray-500 text-sm font-medium">Verifying your email...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg shadow-primary-100/50 border border-gray-100 p-8 md:p-10 max-w-md w-full text-center">
        {status === 'success' ? (
          <div className="space-y-5">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center shadow-lg shadow-accent-200">
              <CheckCircleIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Email Verified!</h1>
              <p className="text-gray-500 text-sm">{message}</p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <svg className="animate-spin h-3 w-3 text-gray-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Redirecting to login...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center shadow-lg shadow-red-200">
              <XCircleIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Verification Failed</h1>
              <p className="text-gray-500 text-sm">{message}</p>
            </div>
            <button onClick={() => navigate('/login')} className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold text-sm shadow-lg shadow-primary-200 hover:shadow-xl hover:shadow-primary-300 hover:from-primary-700 hover:to-primary-600 transition-all">
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
