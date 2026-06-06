import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { UserCheck, UserX, Phone, Mail, Home, Clock, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PendingRegistrations() {
  const { t } = useTranslation()
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(null)

  async function load() {
    const { data } = await supabase
      .from('profiles')
      .select('*, plots(plot_number)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    setPending(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function updateStatus(id, status) {
    setProcessing(id)
    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', id)
    setProcessing(null)
    if (error) { toast.error(error.message); return }
    toast.success(status === 'approved' ? 'User approved!' : 'Registration rejected.')
    load()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      <Link to="/admin" className="inline-flex items-center gap-2 text-forest-600 hover:text-forest-800 mb-6 text-sm font-medium">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-forest-800">{t('admin.pendingRegistrations')}</h1>
        <p className="text-forest-500 mt-1 text-sm">Review and approve new resident registrations</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-28 animate-pulse border border-forest-100" />
          ))}
        </div>
      ) : pending.length === 0 ? (
        <div className="text-center py-20">
          <UserCheck className="w-16 h-16 text-forest-300 mx-auto mb-4" />
          <h2 className="font-display text-xl font-semibold text-forest-600 mb-2">All Clear!</h2>
          <p className="text-forest-400">{t('admin.noRequests')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map(user => (
            <div key={user.id} className="bg-white rounded-2xl border border-forest-100 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-forest-100 rounded-full flex items-center justify-center font-display font-bold text-forest-600">
                      {user.full_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-forest-800">{user.full_name}</h3>
                      <p className="text-xs text-forest-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Registered {new Date(user.created_at).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-forest-600">
                    {user.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-forest-400" />
                        {user.phone}
                      </span>
                    )}
                    {user.plots && (
                      <span className="flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-forest-400" />
                        {user.plots.plot_number}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (window.confirm(t('admin.confirmReject'))) updateStatus(user.id, 'rejected')
                    }}
                    disabled={processing === user.id}
                    className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <UserX className="w-4 h-4" />
                    {t('admin.reject')}
                  </button>
                  <button
                    onClick={() => updateStatus(user.id, 'approved')}
                    disabled={processing === user.id}
                    className="flex items-center gap-2 px-4 py-2 bg-forest-600 text-white rounded-xl text-sm font-medium hover:bg-forest-700 transition-colors disabled:opacity-50"
                  >
                    <UserCheck className="w-4 h-4" />
                    {processing === user.id ? 'Processing...' : t('admin.approve')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
