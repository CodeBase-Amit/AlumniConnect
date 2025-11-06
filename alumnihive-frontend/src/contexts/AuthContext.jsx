import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  console.log('AuthProvider: Initial token from localStorage:', token);

  useEffect(() => {
    console.log('AuthProvider useEffect: Token changed:', token);
    
    if (token) {
      console.log('AuthProvider: Token exists, calling loadUser()');
      loadUser();
    } else {
      console.log('AuthProvider: No token, setting loading to false');
      setLoading(false);
    }
  }, [token]);

  const loadUser = async () => {
    try {
      console.log('AuthProvider: loadUser() called, making API request...');
      const response = await authAPI.getMe();
      console.log('AuthProvider: API Success! User data:', response.data.user);
      setUser(response.data.user);
    } catch (error) {
      console.error('AuthProvider: Failed to load user. Error:', error);
      console.error('Error response:', error.response?.data);
      logout();
    } finally {
      console.log('AuthProvider: Setting loading to false');
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      console.log('AuthProvider: Login called with email:', credentials.email);
      const response = await authAPI.login(credentials);
      const { token, user } = response.data;
      
      console.log('AuthProvider: Login Success! Token:', token);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setToken(token);
      setUser(user);
      
      toast.success(`Welcome back, ${user.name}!`);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      console.error('AuthProvider: Login failed:', message);
      toast.error(message);
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      console.log('AuthProvider: Register called with email:', userData.email);
      const response = await authAPI.register(userData);
      toast.success(response.data.message);
      return { success: true, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      console.error('AuthProvider: Register failed:', message);
      toast.error(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    console.log('AuthProvider: Logout called');
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
    updateUser: setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};