import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import PrivateRoute from './components/PrivateRoute'

// Pages
import AdminLogin from './pages/AdminLogin.jsx'   // ⭐ Added import
import AdminDashboard from './pages/AdminDashboard.jsx'   // ⭐ Added import
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Communities from './pages/Communities.jsx'
import CommunityDetail from './pages/CommunityDetail.jsx'
import Mentorship from './pages/Mentorship.jsx'
import Blogs from './pages/Blogs.jsx'
import BlogDetail from './pages/BlogDetail.jsx'
import CreateBlog from './pages/CreateBlog.jsx'
import EditBlog from './pages/EditBlog.jsx'   // ⭐ Added import
import Questions from './pages/Questions.jsx'
import AskQuestion from './pages/AskQuestion.jsx'   // ⭐ Added import
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

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />

            {/* Protected Routes */}
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

            {/* Communities */}
            <Route path="/communities" element={<PrivateRoute><Communities /></PrivateRoute>} />
            <Route path="/communities/:id" element={<PrivateRoute><CommunityDetail /></PrivateRoute>} />

            {/* Mentorship */}
            <Route path="/mentorship" element={<PrivateRoute><Mentorship /></PrivateRoute>} />

            {/* Blogs */}
            <Route path="/blogs" element={<PrivateRoute><Blogs /></PrivateRoute>} />
            <Route path="/blogs/create" element={<PrivateRoute><CreateBlog /></PrivateRoute>} />
            <Route path="/blogs/edit/:id" element={<PrivateRoute><EditBlog /></PrivateRoute>} />
            <Route path="/blogs/:slug" element={<PrivateRoute><BlogDetail /></PrivateRoute>} />

            {/* Q&A Routes */}
            <Route path="/questions" element={<PrivateRoute><Questions /></PrivateRoute>} />
            <Route path="/questions/ask" element={<PrivateRoute><AskQuestion /></PrivateRoute>} />
            <Route path="/questions/:slug" element={<PrivateRoute><QuestionDetail /></PrivateRoute>} />

            {/* Events */}
            <Route path="/events" element={<PrivateRoute><Events /></PrivateRoute>} />

            {/* Chat */}
            <Route path="/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />

            {/* Profile */}
            <Route path="/profile/:id?" element={<PrivateRoute><Profile /></PrivateRoute>} />

            {/* Redirect fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </SocketProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
