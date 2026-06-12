import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import notify from '../lib/notify'
import { Building2, Plus, X, AlertCircle, CalendarDays } from 'lucide-react'

const FACILITIES = ['community_hall','clubhouse','sports_court','guest_house','terrace']
const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-forest-100 text-forest-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

const RULES = {
  facility: v => (!v ? 'Select a facility' : ''),
  booking_date: v => {
    if (!v) return 'Booking date is required'
    if (new Date(v) < new Date(new Date().toDateString())) return 'Date cannot be in the past'
    return ''
  },
  start_time: v => (!v ? 'Start time is required' : ''),
  end_time: (v, start) => {
    if (!v) return 'End time is required'
    if (start && v <= start) return 'End time must be after start time'
    return ''
  },
  purpose: v => {
    if (!v?.trim()) return 'Purpose is required'
    if (v.trim().length < 3) return 'Purpose too short'
    return ''
  },
}

function inputClass(touched, error) {
  const base = 'w-full px-3.5 py-2.5 border-2 rounded-xl text-sm focus:outline-none transition-all bg-white'
  if (!touched) return `${base} border-gray-200 focus:border-forest-400 focus:ring-4 focus:ring-forest-100`
  if (error) return `${base} border-red-400 bg-red-50/30 focus:border-red-400 focus:ring-4 focus:ring-red-100`
  return `${base} border-forest-400 bg-forest-50/30 focus:border-forest-500 focus:ring-4 focus:ring-forest-100`
}

function FieldMsg({ touched, error }) {
  if (!touched || !error) return null
  return (
    <p className="flex items-center gap-1 mt-1 text-xs text-red-600 font-medium">
      <AlertCircle className="w-3 h-3 shrink-0" />{error}
    </p>
  )
}

const FACILITY_ICONS = { community_hall: '🏛️', clubhouse: '🏠', sports_court: '🏸', guest_house: '🛏️', terrace: '🌿' }

export default function Facilities() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [tab, setTab] = useState('mine')
  const [form, setForm] = useState({ facility: 'community_hall', booking_date: '', start_time: '', end_time: '', purpose: '', attendees_count: '' })
  const [touched, setTouched] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [allBookings, setAllBookings] = useState([])

  function fetchBookings() {
    Promise.all([
      supabase.from('facility_bookings').select('*').eq('booked_by', profile.id).order('booking_date', { ascending: false }),
      supabase.from('facility_bookings').select('*, profiles(full_name)').order('booking_date', { ascending: false }),
    ]).then(([{ data: mine }, { data: all }]) => {
      setBookings(mine ?? [])
      setAllBookings(all ?? [])
      setLoading(false)
    })
  }

  useEffect(() => { if (profile?.id) fetchBookings() }, [profile?.id])

  const errors = {
    facility: RULES.facility(form.facility),
    booking_date: RULES.booking_date(form.booking_date),
    start_time: RULES.start_time(form.start_time),
    end_time: RULES.end_time(form.end_time, form.start_time),
    purpose: RULES.purpose(form.purpose),
  }
  const formValid = !Object.values(errors).some(Boolean)

  async function submitBooking() {
    setTouched({ facility: true, booking_date: true, start_time: true, end_time: true, purpose: true })
    if (!formValid) return
    setSubmitting(true)
    const { error } = await supabase.from('facility_bookings').insert({
      facility: form.facility,
      plot_id: profile.plot_id,
      booked_by: profile.id,
      booking_date: form.booking_date,
      start_time: form.start_time,
      end_time: form.end_time,
      purpose: form.purpose.trim(),
      attendees_count: form.attendees_count ? parseInt(form.attendees_count) : null,
    })
    setSubmitting(false)
    if (error) { notify.error('Booking failed', error.message); return }
    notify.success('Booking submitted! Awaiting admin approval.')
    setShowModal(false)
    setForm({ facility: 'community_hall', booking_date: '', start_time: '', end_time: '', purpose: '', attendees_count: '' })
    setTouched({})
    fetchBookings()
  }

  async function cancelBooking(id) {
    if (!window.confirm('Cancel this booking?')) return
    const { error } = await supabase.from('facility_bookings').update({ status: 'cancelled' }).eq('id', id)
    if (error) { notify.error('Cancel failed', error.message); return }
    notify.success('Booking cancelled')
    setBookings(b => b.map(x => x.id === id ? { ...x, status: 'cancelled' } : x))
  }

  const upcomingAll = allBookings.filter(b => b.status === 'approved' && new Date(b.booking_date) >= new Date(new Date().toDateString()))

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-forest-800">{t('facilities.title')}</h1>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold text-sm rounded-xl transition-colors">
          <Plus className="w-4 h-4" />{t('facilities.book')}
        </button>
      </div>

      {/* Upcoming approved bookings widget */}
      {upcomingAll.length > 0 && (
        <div className="bg-forest-50 border border-forest-200 rounded-2xl p-4 mb-6">
          <p className="text-xs font-semibold text-forest-600 uppercase tracking-wide mb-3">{t('facilities.upcomingBookings')}</p>
          <div className="space-y-2">
            {upcomingAll.slice(0, 3).map(b => (
              <div key={b.id} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 border border-forest-100">
                <span className="text-lg">{FACILITY_ICONS[b.facility]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-forest-800">{t(`facilities.${b.facility}`)}</p>
                  <p className="text-xs text-forest-400">{new Date(b.booking_date).toLocaleDateString('en-IN')} · {b.start_time}–{b.end_time}</p>
                </div>
                {b.profiles?.full_name && <span className="text-xs text-forest-500">{b.profiles.full_name}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-forest-50 p-1 rounded-xl mb-6 border border-forest-100">
        {[['mine', t('facilities.myBookings')], ['all', t('facilities.allBookings')]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tab === k ? 'bg-white text-forest-800 shadow-sm' : 'text-forest-500 hover:text-forest-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_,i) => <div key={i} className="h-16 bg-forest-50 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {(tab === 'mine' ? bookings : allBookings).length === 0 ? (
            <div className="text-center py-14 text-forest-400">
              <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">{t('facilities.noBookings')}</p>
            </div>
          ) : (tab === 'mine' ? bookings : allBookings).map(b => (
            <div key={b.id} className="bg-white border border-forest-100 rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{FACILITY_ICONS[b.facility]}</span>
                <div>
                  <p className="font-semibold text-forest-800 text-sm">{t(`facilities.${b.facility}`)}</p>
                  <p className="text-xs text-forest-400">
                    {new Date(b.booking_date).toLocaleDateString('en-IN')} · {b.start_time}–{b.end_time}
                    {tab === 'all' && b.profiles?.full_name ? ` · ${b.profiles.full_name}` : ''}
                  </p>
                  <p className="text-xs text-forest-500 mt-0.5">{b.purpose}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[b.status]}`}>
                  {t(`facilities.${b.status}`)}
                </span>
                {tab === 'mine' && b.status === 'pending' && (
                  <button onClick={() => cancelBooking(b.id)}
                    className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
                    {t('facilities.cancelBooking')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-forest-100 sticky top-0 bg-white">
              <h2 className="font-display font-bold text-forest-800 text-lg">{t('facilities.book')}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-forest-400 hover:bg-forest-50"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-2">Facility *</label>
                <div className="grid grid-cols-2 gap-2">
                  {FACILITIES.map(f => (
                    <button key={f} type="button" onClick={() => setForm(x => ({ ...x, facility: f }))}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all text-left ${form.facility === f ? 'border-forest-600 bg-forest-50 text-forest-800' : 'border-gray-200 hover:border-forest-300 text-forest-600'}`}>
                      <span>{FACILITY_ICONS[f]}</span>
                      <span className="truncate">{t(`facilities.${f}`)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">{t('facilities.date')} *</label>
                <input type="date" value={form.booking_date} onChange={e => setForm(f => ({ ...f, booking_date: e.target.value }))}
                  onBlur={() => setTouched(p => ({ ...p, booking_date: true }))}
                  min={new Date().toISOString().split('T')[0]}
                  className={inputClass(touched.booking_date, errors.booking_date)} />
                <FieldMsg touched={touched.booking_date} error={errors.booking_date} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">{t('facilities.startTime')} *</label>
                  <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                    onBlur={() => setTouched(p => ({ ...p, start_time: true }))}
                    className={inputClass(touched.start_time, errors.start_time)} />
                  <FieldMsg touched={touched.start_time} error={errors.start_time} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">{t('facilities.endTime')} *</label>
                  <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                    onBlur={() => setTouched(p => ({ ...p, end_time: true }))}
                    className={inputClass(touched.end_time, errors.end_time)} />
                  <FieldMsg touched={touched.end_time} error={errors.end_time} />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">{t('facilities.purpose')} *</label>
                <input value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
                  onBlur={() => setTouched(p => ({ ...p, purpose: true }))}
                  placeholder="e.g. Birthday party, Meeting"
                  className={inputClass(touched.purpose, errors.purpose)} />
                <FieldMsg touched={touched.purpose} error={errors.purpose} />
              </div>

              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">{t('facilities.attendees')}</label>
                <input type="number" value={form.attendees_count} onChange={e => setForm(f => ({ ...f, attendees_count: e.target.value }))}
                  min={1} max={500} placeholder="Approx. number of people"
                  className={inputClass(false, '')} />
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={submitBooking} disabled={submitting}
                className="flex-1 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold rounded-xl disabled:opacity-60 transition-colors text-sm">
                {submitting ? 'Submitting...' : t('common.submit')}
              </button>
              <button onClick={() => setShowModal(false)}
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
