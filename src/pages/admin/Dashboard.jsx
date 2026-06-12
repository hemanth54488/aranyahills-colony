import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import {
  Users, Home, Bell, UserCheck, UserX, Settings, ClipboardList, FileText,
  ChevronRight, IndianRupee, MessageSquare, Building2, CalendarDays,
  BarChart2, ClipboardCheck, ShieldCheck, FolderOpen
} from 'lucide-react'

function StatCard({ icon: Icon, value, label, to, color }) {
  return (
    <Link to={to} className="bg-white rounded-2xl p-5 border border-forest-100 hover:shadow-md hover:border-forest-300 transition-all flex items-center gap-4 group">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-2xl font-display font-bold text-forest-800">{value}</div>
        <div className="text-sm text-forest-500 truncate">{label}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-forest-300 group-hover:text-forest-500 transition-colors" />
    </Link>
  )
}

const ADMIN_SECTIONS = [
  {
    title: 'Resident Management',
    links: [
      { to: '/admin/registrations', label: 'Pending Registrations', icon: UserCheck },
      { to: '/admin/committee', label: 'Manage Committee', icon: Users },
      { to: '/admin/plots', label: 'Manage Plots', icon: Home },
    ],
  },
  {
    title: 'Colony Operations',
    links: [
      { to: '/admin/notices', label: 'Manage Notices', icon: Bell },
      { to: '/admin/maintenance', label: 'Maintenance Fees', icon: IndianRupee },
      { to: '/admin/complaints', label: 'Complaints', icon: MessageSquare },
      { to: '/admin/facilities', label: 'Facility Bookings', icon: Building2 },
      { to: '/admin/documents', label: 'Documents', icon: FolderOpen },
    ],
  },
  {
    title: 'Community',
    links: [
      { to: '/admin/events', label: 'Manage Events', icon: CalendarDays },
      { to: '/admin/polls', label: 'Manage Polls', icon: BarChart2 },
      { to: '/admin/audit-logs', label: 'Audit Logs', icon: ClipboardCheck },
    ],
  },
]

export default function AdminDashboard() {
  const { t } = useTranslation()
  const [stats, setStats] = useState({ pending: 0, approved: 0, committee: 0, plots: 0, openComplaints: 0, pendingBookings: 0 })

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }).eq('status', 'pending'),
      supabase.from('profiles').select('id', { count: 'exact' }).eq('status', 'approved'),
      supabase.from('committee_members').select('id', { count: 'exact' }).eq('is_active', true),
      supabase.from('plots').select('id', { count: 'exact' }),
      supabase.from('complaints').select('id', { count: 'exact' }).eq('status', 'open'),
      supabase.from('facility_bookings').select('id', { count: 'exact' }).eq('status', 'pending'),
    ]).then(([{ count: pending }, { count: approved }, { count: committee }, { count: plots }, { count: openC }, { count: pendingB }]) => {
      setStats({ pending: pending ?? 0, approved: approved ?? 0, committee: committee ?? 0, plots: plots ?? 0, openComplaints: openC ?? 0, pendingBookings: pendingB ?? 0 })
    })
  }, [])

  const statCards = [
    { to: '/admin/registrations', icon: UserCheck, label: 'Pending Registrations', value: stats.pending, color: stats.pending > 0 ? 'bg-orange-500' : 'bg-forest-400' },
    { to: '/admin/complaints', icon: MessageSquare, label: 'Open Complaints', value: stats.openComplaints, color: stats.openComplaints > 0 ? 'bg-red-500' : 'bg-forest-400' },
    { to: '/admin/facilities', icon: Building2, label: 'Pending Bookings', value: stats.pendingBookings, color: stats.pendingBookings > 0 ? 'bg-amber-500' : 'bg-forest-400' },
    { to: '/admin/committee', icon: Users, label: 'Committee Members', value: stats.committee, color: 'bg-forest-600' },
    { to: '/admin/plots', icon: Home, label: 'Total Plots', value: stats.plots, color: 'bg-earth-500' },
    { to: '/admin/maintenance', icon: IndianRupee, label: 'Maintenance', value: '→', color: 'bg-forest-500' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-forest-500" />
          <span className="text-sm text-forest-500 font-medium">Admin Panel</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-forest-800">{t('admin.dashboard')}</h1>
        <p className="text-forest-500 mt-1 text-sm">Aranya Hills Colony Welfare Association</p>
      </div>

      {/* Alert for pending registrations */}
      {stats.pending > 0 && (
        <Link to="/admin/registrations"
          className="flex items-center gap-3 bg-orange-50 border border-orange-200 text-orange-700 rounded-xl px-5 py-4 mb-6 hover:bg-orange-100 transition-colors">
          <UserX className="w-5 h-5 shrink-0" />
          <span className="font-medium">
            {stats.pending} resident registration{stats.pending > 1 ? 's' : ''} waiting for approval
          </span>
          <ChevronRight className="w-4 h-4 ml-auto" />
        </Link>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {statCards.map(({ to, icon, label, value, color }) => (
          <StatCard key={to} to={to} icon={icon} label={label} value={value} color={color} />
        ))}
      </div>

      {/* Admin sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ADMIN_SECTIONS.map(section => (
          <div key={section.title} className="bg-white rounded-2xl border border-forest-100 p-5">
            <h2 className="font-semibold text-forest-700 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-forest-400" />
              {section.title}
            </h2>
            <div className="space-y-1">
              {section.links.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent hover:bg-forest-50 hover:border-forest-100 transition-all text-sm font-medium text-forest-700 group">
                  <Icon className="w-4 h-4 text-forest-400 group-hover:text-forest-600 transition-colors" />
                  {label}
                  <ChevronRight className="w-3 h-3 ml-auto text-forest-200 group-hover:text-forest-400 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
