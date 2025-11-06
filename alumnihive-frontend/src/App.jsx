import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import PrivateRoute from './components/PrivateRoute'

// Pages
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import VerifyEmail from './pages/VerifyEmail.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Communities from './pages/Communities.jsx'
import CommunityDetail from './pages/CommunityDetail.jsx'
import Mentorship from './pages/Mentorship.jsx'
import Blogs from './pages/Blogs.jsx'
import BlogDetail from './pages/BlogDetail.jsx'
import Questions from './pages/Questions.jsx'
import QuestionDetail from './pages/QuestionDetail.jsx'
import Profile from './pages/Profile.jsx'
import Events from './pages/Events.jsx'
import ChatPage from './pages/ChatPage.jsx'

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />

            {/* Protected Routes */}
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/communities" element={<PrivateRoute><Communities /></PrivateRoute>} />
            <Route path="/communities/:id" element={<PrivateRoute><CommunityDetail /></PrivateRoute>} />
            <Route path="/mentorship" element={<PrivateRoute><Mentorship /></PrivateRoute>} />
            <Route path="/blogs" element={<PrivateRoute><Blogs /></PrivateRoute>} />
            <Route path="/blogs/:slug" element={<PrivateRoute><BlogDetail /></PrivateRoute>} />
            <Route path="/questions" element={<PrivateRoute><Questions /></PrivateRoute>} />
            <Route path="/questions/:id" element={<PrivateRoute><QuestionDetail /></PrivateRoute>} />
            <Route path="/events" element={<PrivateRoute><Events /></PrivateRoute>} />
            <Route path="/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
            <Route path="/profile/:id?" element={<PrivateRoute><Profile /></PrivateRoute>} />

            {/* Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </Router>
  )
}

export default App