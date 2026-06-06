import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Committee from './pages/Committee'
import Plots from './pages/Plots'
import PlotDetail from './pages/PlotDetail'
import ColonyInfo from './pages/ColonyInfo'
import Services from './pages/Services'
import Notices from './pages/Notices'
import AdminDashboard from './pages/admin/Dashboard'
import ManageCommittee from './pages/admin/ManageCommittee'
import PendingRegistrations from './pages/admin/PendingRegistrations'
import ManagePlots from './pages/admin/ManagePlots'

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="flex-1 flex items-center justify-center text-forest-600">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (profile?.status === 'pending') return (
    <div className="flex-1 flex items-center justify-center p-8 text-center">
      <div className="bg-earth-50 border border-earth-200 rounded-xl p-8 max-w-md">
        <p className="text-earth-700 text-lg font-medium">Account Pending Approval</p>
        <p className="text-earth-500 mt-2">The secretary will review your registration shortly.</p>
      </div>
    </div>
  )
  if (adminOnly && profile?.role !== 'admin') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-forest-50">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/committee" element={<Committee />} />
          <Route path="/notices" element={<Notices />} />

          <Route path="/plots" element={
            <ProtectedRoute><Plots /></ProtectedRoute>
          } />
          <Route path="/plots/:id" element={
            <ProtectedRoute><PlotDetail /></ProtectedRoute>
          } />
          <Route path="/colony-info" element={
            <ProtectedRoute><ColonyInfo /></ProtectedRoute>
          } />
          <Route path="/services" element={
            <ProtectedRoute><Services /></ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/committee" element={
            <ProtectedRoute adminOnly><ManageCommittee /></ProtectedRoute>
          } />
          <Route path="/admin/registrations" element={
            <ProtectedRoute adminOnly><PendingRegistrations /></ProtectedRoute>
          } />
          <Route path="/admin/plots" element={
            <ProtectedRoute adminOnly><ManagePlots /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
