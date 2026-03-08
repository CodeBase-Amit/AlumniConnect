import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

// Added default user value inside createContext
export const AuthContext = createContext({
  user: null, // ← Should have user
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const getStoredToken = () => sessionStorage.getItem('token') || localStorage.getItem('token');

  const migrateLegacyToken = () => {
    const sessionToken = sessionStorage.getItem('token');
    const localToken = localStorage.getItem('token');

    if (!sessionToken && localToken) {
      sessionStorage.setItem('token', localToken);
      const legacyUser = localStorage.getItem('user');
      if (legacyUser) {
        sessionStorage.setItem('user', legacyUser);
      }
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(getStoredToken());

  useEffect(() => {
    migrateLegacyToken();
    setToken(getStoredToken());
  }, []);

  useEffect(() => {
    if (token) {
      setLoading(true);
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadUser = async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to load user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token, user } = response.data;

      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));

      setToken(token);
      setUser(user);

      toast.success(`Welcome back, ${user.name}!`);
      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      toast.success(response.data?.message || 'Registration successful');

      if (response.data?.token) {
        sessionStorage.setItem('token', response.data.token);
        sessionStorage.setItem('user', JSON.stringify(response.data.user));
        setToken(response.data.token);
        setUser(response.data.user);
      }

      return { success: true, message: response.data?.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    refreshUser: loadUser,
    updateUser: setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
