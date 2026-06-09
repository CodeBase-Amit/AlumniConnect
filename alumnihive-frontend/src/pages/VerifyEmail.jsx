import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
      <div className="text-center"><div className="animate-spin rounded-full h-10 w-10 border-[3px] border-primary-600 border-t-transparent mx-auto mb-3"></div><p className="text-gray-500 text-sm">Verifying your email...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-float p-8 max-w-md w-full text-center">
        {status === 'success' ? (
          <><CheckCircleIcon className="w-16 h-16 text-accent-500 mx-auto mb-4" /><h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1><p className="text-gray-500 text-sm mb-4">{message}</p><p className="text-xs text-gray-400">Redirecting to login...</p></>
        ) : (
          <><XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" /><h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1><p className="text-gray-500 text-sm mb-6">{message}</p><button onClick={() => navigate('/login')} className="btn-primary w-full justify-center">Back to Login</button></>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
