import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import {
  Users, Home, Bell, UserCheck, UserX, Settings,
  ClipboardList, FileText, ChevronRight
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

export default function AdminDashboard() {
  const { t } = useTranslation()
  const [stats, setStats] = useState({ pending: 0, approved: 0, committee: 0, plots: 0 })

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }).eq('status', 'pending'),
      supabase.from('profiles').select('id', { count: 'exact' }).eq('status', 'approved'),
      supabase.from('committee_members').select('id', { count: 'exact' }).eq('is_active', true),
      supabase.from('plots').select('id', { count: 'exact' }),
    ]).then(([{ count: pending }, { count: approved }, { count: committee }, { count: plots }]) => {
      setStats({ pending: pending ?? 0, approved: approved ?? 0, committee: committee ?? 0, plots: plots ?? 0 })
    })
  }, [])

  const adminLinks = [
    { to: '/admin/registrations', icon: UserCheck, label: 'Pending Registrations', value: stats.pending, color: 'bg-orange-500', alert: stats.pending > 0 },
    { to: '/admin/committee', icon: Users, label: 'Committee Members', value: stats.committee, color: 'bg-forest-600' },
    { to: '/admin/plots', icon: Home, label: 'Manage Plots', value: stats.plots, color: 'bg-earth-500' },
    { to: '/notices', icon: Bell, label: 'Notices', value: '→', color: 'bg-forest-500' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Header */}
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
            {stats.pending} resident registration{stats.pending > 1 ? 's' : ''} waiting for your approval
          </span>
          <ChevronRight className="w-4 h-4 ml-auto" />
        </Link>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {adminLinks.map(({ to, icon, label, value, color }) => (
          <StatCard key={to} to={to} icon={icon} label={label} value={value} color={color} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-forest-100 p-6">
        <h2 className="font-display text-lg font-bold text-forest-800 mb-4 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-forest-500" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { to: '/admin/registrations', label: 'Review Registrations', icon: UserCheck },
            { to: '/admin/committee', label: 'Add Committee Member', icon: Users },
            { to: '/admin/plots', label: 'Update Plot Status', icon: Home },
            { to: '/colony-info', label: 'View Colony Info', icon: FileText },
            { to: '/notices', label: 'View Notices', icon: Bell },
            { to: '/services', label: 'Manage Services', icon: Settings },
          ].map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-forest-100 hover:bg-forest-50 hover:border-forest-200 transition-colors text-sm font-medium text-forest-700">
              <Icon className="w-4 h-4 text-forest-500" />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
