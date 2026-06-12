import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'

// Public pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ResetPassword from './pages/ResetPassword'
import Committee from './pages/Committee'
import Notices from './pages/Notices'
import Events from './pages/Events'

// Protected resident pages
import Plots from './pages/Plots'
import PlotDetail from './pages/PlotDetail'
import ColonyInfo from './pages/ColonyInfo'
import Services from './pages/Services'
import Profile from './pages/Profile'
import IdCard from './pages/IdCard'
import Maintenance from './pages/Maintenance'
import Complaints from './pages/Complaints'
import ComplaintDetail from './pages/ComplaintDetail'
import Facilities from './pages/Facilities'
import Visitors from './pages/Visitors'
import Polls from './pages/Polls'
import Classifieds from './pages/Classifieds'
import Documents from './pages/Documents'

// Security role page
import Security from './pages/Security'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import ManageCommittee from './pages/admin/ManageCommittee'
import PendingRegistrations from './pages/admin/PendingRegistrations'
import ManagePlots from './pages/admin/ManagePlots'
import ManageNotices from './pages/admin/ManageNotices'
import ManageMaintenance from './pages/admin/ManageMaintenance'
import ManageComplaints from './pages/admin/ManageComplaints'
import ManageFacilities from './pages/admin/ManageFacilities'
import ManageEvents from './pages/admin/ManageEvents'
import ManagePolls from './pages/admin/ManagePolls'
import AuditLogs from './pages/admin/AuditLogs'
import ManageDocuments from './pages/admin/ManageDocuments'
import AddResident from './pages/admin/AddResident'
import ManageResidents from './pages/admin/ManageResidents'

function ProtectedRoute({ children, adminOnly = false, securityAllowed = false }) {
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
  if (!securityAllowed && profile?.status !== 'approved') return <Navigate to="/" replace />
  return children
}

function SecurityRoute({ children }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="flex-1 flex items-center justify-center text-forest-600">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (profile?.role !== 'security' && profile?.role !== 'admin') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-forest-50">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col">
        <Routes>
          {/* ── Public ── */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/committee" element={<Committee />} />
          <Route path="/notices" element={<Notices />} />
          <Route path="/events" element={<Events />} />

          {/* ── Approved residents ── */}
          <Route path="/plots" element={<ProtectedRoute><Plots /></ProtectedRoute>} />
          <Route path="/plots/:id" element={<ProtectedRoute><PlotDetail /></ProtectedRoute>} />
          <Route path="/colony-info" element={<ProtectedRoute><ColonyInfo /></ProtectedRoute>} />
          <Route path="/services" element={<ProtectedRoute><Services /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/id-card" element={<ProtectedRoute><IdCard /></ProtectedRoute>} />
          <Route path="/maintenance" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
          <Route path="/complaints" element={<ProtectedRoute><Complaints /></ProtectedRoute>} />
          <Route path="/complaints/:id" element={<ProtectedRoute><ComplaintDetail /></ProtectedRoute>} />
          <Route path="/facilities" element={<ProtectedRoute><Facilities /></ProtectedRoute>} />
          <Route path="/visitors" element={<ProtectedRoute><Visitors /></ProtectedRoute>} />
          <Route path="/polls" element={<ProtectedRoute><Polls /></ProtectedRoute>} />
          <Route path="/classifieds" element={<ProtectedRoute><Classifieds /></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />

          {/* ── Security role ── */}
          <Route path="/security" element={<SecurityRoute><Security /></SecurityRoute>} />

          {/* ── Admin ── */}
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/committee" element={<ProtectedRoute adminOnly><ManageCommittee /></ProtectedRoute>} />
          <Route path="/admin/registrations" element={<ProtectedRoute adminOnly><PendingRegistrations /></ProtectedRoute>} />
          <Route path="/admin/plots" element={<ProtectedRoute adminOnly><ManagePlots /></ProtectedRoute>} />
          <Route path="/admin/notices" element={<ProtectedRoute adminOnly><ManageNotices /></ProtectedRoute>} />
          <Route path="/admin/maintenance" element={<ProtectedRoute adminOnly><ManageMaintenance /></ProtectedRoute>} />
          <Route path="/admin/complaints" element={<ProtectedRoute adminOnly><ManageComplaints /></ProtectedRoute>} />
          <Route path="/admin/facilities" element={<ProtectedRoute adminOnly><ManageFacilities /></ProtectedRoute>} />
          <Route path="/admin/events" element={<ProtectedRoute adminOnly><ManageEvents /></ProtectedRoute>} />
          <Route path="/admin/polls" element={<ProtectedRoute adminOnly><ManagePolls /></ProtectedRoute>} />
          <Route path="/admin/audit-logs" element={<ProtectedRoute adminOnly><AuditLogs /></ProtectedRoute>} />
          <Route path="/admin/documents" element={<ProtectedRoute adminOnly><ManageDocuments /></ProtectedRoute>} />
          <Route path="/admin/add-resident" element={<ProtectedRoute adminOnly><AddResident /></ProtectedRoute>} />
          <Route path="/admin/residents" element={<ProtectedRoute adminOnly><ManageResidents /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </div>  {/* flex-1 wrapper */}
      </main>
      <Footer />
    </div>
  )
}
