import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import notify from '../../lib/notify'
import { Building2, ArrowLeft, CheckCircle, X, AlertCircle } from 'lucide-react'

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-forest-100 text-forest-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
}
const FACILITY_ICONS = { community_hall: '🏛️', clubhouse: '🏠', sports_court: '🏸', guest_house: '🛏️', terrace: '🌿' }

export default function ManageFacilities() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('pending')
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [saving, setSaving] = useState(false)

  function fetchBookings() {
    supabase.from('facility_bookings')
      .select('*, profiles(full_name, phone), plots(plot_number)')
      .order('booking_date', { ascending: false })
      .then(({ data }) => { setBookings(data ?? []); setLoading(false) })
  }

  useEffect(() => { fetchBookings() }, [])

  async function approveBooking(id) {
    setSaving(true)
    const { error } = await supabase.from('facility_bookings').update({ status: 'approved', approved_by: profile.id }).eq('id', id)
    setSaving(false)
    if (error) { notify.error('Approve failed', error.message); return }
    notify.success('Booking approved')
    fetchBookings()
  }

  async function rejectBooking() {
    setSaving(true)
    const { error } = await supabase.from('facility_bookings').update({ status: 'rejected', rejection_reason: rejectReason.trim() || null }).eq('id', rejectModal)
    setSaving(false)
    if (error) { notify.error('Reject failed', error.message); return }
    notify.success('Booking rejected')
    setRejectModal(null)
    setRejectReason('')
    fetchBookings()
  }

  const filtered = filterStatus === 'all' ? bookings : bookings.filter(b => b.status === filterStatus)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/admin" className="p-2 rounded-xl text-forest-500 hover:bg-forest-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-display text-2xl font-bold text-forest-800">{t('admin.manageFacilities')}</h1>
        <span className="ml-auto text-sm text-forest-500">{bookings.filter(b => b.status === 'pending').length} pending</span>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap mb-5">
        {['all','pending','approved','rejected','cancelled'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterStatus === s ? 'bg-forest-700 text-white' : 'bg-white border border-forest-200 text-forest-600 hover:bg-forest-50'}`}>
            {s === 'all' ? 'All' : t(`facilities.${s}`)}
            {s !== 'all' && ` (${bookings.filter(b => b.status === s).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_,i) => <div key={i} className="h-16 bg-forest-50 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14 text-forest-400">
          <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No bookings found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(b => (
            <div key={b.id} className="bg-white border border-forest-100 rounded-xl p-4 flex items-center gap-4">
              <span className="text-2xl shrink-0">{FACILITY_ICONS[b.facility]}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-forest-800 text-sm">{t(`facilities.${b.facility}`)}</p>
                <p className="text-xs text-forest-400">
                  {new Date(b.booking_date).toLocaleDateString('en-IN')} · {b.start_time}–{b.end_time} · {b.profiles?.full_name} ({b.plots?.plot_number})
                </p>
                <p className="text-xs text-forest-500 mt-0.5">{b.purpose}</p>
                {b.rejection_reason && <p className="text-xs text-red-500 mt-0.5">Reason: {b.rejection_reason}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[b.status]}`}>
                  {t(`facilities.${b.status}`)}
                </span>
                {b.status === 'pending' && (
                  <>
                    <button onClick={() => approveBooking(b.id)} disabled={saving}
                      className="flex items-center gap-1 px-3 py-1.5 bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60">
                      <CheckCircle className="w-3.5 h-3.5" />Approve
                    </button>
                    <button onClick={() => setRejectModal(b.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg transition-colors border border-red-200">
                      <X className="w-3.5 h-3.5" />Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-6 pt-5 pb-4 border-b border-forest-100">
              <h2 className="font-display font-bold text-forest-800">{t('facilities.rejectBooking')}</h2>
            </div>
            <div className="px-6 py-4">
              <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">{t('facilities.rejectionReason')}</label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
                placeholder="Reason for rejection (optional)"
                className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-forest-400 bg-white resize-none" />
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={rejectBooking} disabled={saving}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl disabled:opacity-60 transition-colors text-sm">
                {saving ? 'Rejecting...' : t('facilities.rejectBooking')}
              </button>
              <button onClick={() => { setRejectModal(null); setRejectReason('') }}
                className="flex-1 py-2.5 border border-forest-200 text-forest-600 rounded-xl hover:bg-forest-50 transition-colors text-sm">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
