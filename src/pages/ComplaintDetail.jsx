import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import notify from '../lib/notify'
import { ArrowLeft, Clock, Star, AlertCircle } from 'lucide-react'

const STATUS_STYLES = {
  open: 'bg-blue-100 text-blue-700 border-blue-200',
  assigned: 'bg-amber-100 text-amber-700 border-amber-200',
  in_progress: 'bg-purple-100 text-purple-700 border-purple-200',
  resolved: 'bg-forest-100 text-forest-700 border-forest-200',
  closed: 'bg-gray-100 text-gray-600 border-gray-200',
}
const PRIORITY_STYLES = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}
const STATUS_ORDER = ['open','assigned','in_progress','resolved','closed']

export default function ComplaintDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const { profile } = useAuth()
  const [complaint, setComplaint] = useState(null)
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [submittingRating, setSubmittingRating] = useState(false)

  async function loadData() {
    const [{ data: c }, { data: u }] = await Promise.all([
      supabase.from('complaints').select('*, profiles!created_by(full_name), assigned:profiles!assigned_to(full_name)').eq('id', id).single(),
      supabase.from('complaint_updates').select('*, profiles(full_name)').eq('complaint_id', id).order('created_at'),
    ])
    setComplaint(c)
    setUpdates(u ?? [])
    if (c?.rating) setRating(c.rating)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [id])

  async function submitRating(r) {
    if (complaint?.created_by !== profile?.id) return
    setSubmittingRating(true)
    const { error } = await supabase.from('complaints').update({ rating: r }).eq('id', id)
    setSubmittingRating(false)
    if (error) { notify.error('Failed to submit rating'); return }
    setRating(r)
    notify.success('Thank you for your feedback!')
  }

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-10 text-center text-forest-400">{t('common.loading')}</div>
  if (!complaint) return <div className="max-w-2xl mx-auto px-4 py-10 text-center text-forest-400">Complaint not found</div>

  const currentStep = STATUS_ORDER.indexOf(complaint.status)

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/complaints" className="p-2 rounded-xl text-forest-500 hover:bg-forest-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-display text-xl font-bold text-forest-800">{t('complaints.title')}</h1>
      </div>

      {/* Complaint card */}
      <div className="bg-white border border-forest-100 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 className="font-semibold text-forest-900 text-lg leading-tight flex-1">{complaint.title}</h2>
          <div className="flex gap-2 shrink-0">
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PRIORITY_STYLES[complaint.priority]}`}>
              {t(`complaints.${complaint.priority}`)}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${STATUS_STYLES[complaint.status]}`}>
              {t(`complaints.${complaint.status}`)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div>
            <span className="text-forest-400 text-xs uppercase tracking-wide">{t('complaints.category')}</span>
            <p className="font-medium text-forest-700 mt-0.5">{t(`complaints.${complaint.category}`)}</p>
          </div>
          <div>
            <span className="text-forest-400 text-xs uppercase tracking-wide">{t('complaints.submittedOn')}</span>
            <p className="font-medium text-forest-700 mt-0.5">{new Date(complaint.created_at).toLocaleDateString('en-IN')}</p>
          </div>
          {complaint.assigned?.full_name && (
            <div>
              <span className="text-forest-400 text-xs uppercase tracking-wide">Assigned To</span>
              <p className="font-medium text-forest-700 mt-0.5">{complaint.assigned.full_name}</p>
            </div>
          )}
        </div>

        {complaint.description && (
          <div className="bg-forest-50 rounded-xl p-3 text-sm text-forest-700 mb-4">{complaint.description}</div>
        )}

        {complaint.resolution_note && (
          <div className="bg-forest-100 border border-forest-200 rounded-xl p-3 text-sm text-forest-700">
            <span className="font-semibold text-forest-600 text-xs uppercase tracking-wide block mb-1">Resolution Note</span>
            {complaint.resolution_note}
          </div>
        )}
      </div>

      {/* Progress stepper */}
      <div className="bg-white border border-forest-100 rounded-2xl p-5 mb-6">
        <p className="text-xs font-semibold text-forest-500 uppercase tracking-wide mb-4">{t('complaints.timeline')}</p>
        <div className="flex items-center justify-between">
          {STATUS_ORDER.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  i <= currentStep
                    ? 'bg-forest-700 border-forest-700 text-white'
                    : 'bg-white border-forest-200 text-forest-300'
                }`}>
                  {i < currentStep ? '✓' : i + 1}
                </div>
                <span className={`text-[9px] mt-1 text-center leading-tight ${i <= currentStep ? 'text-forest-700 font-semibold' : 'text-forest-300'}`}>
                  {t(`complaints.${s}`)}
                </span>
              </div>
              {i < STATUS_ORDER.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 mb-4 rounded ${i < currentStep ? 'bg-forest-600' : 'bg-forest-100'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Updates timeline */}
      {updates.length > 0 && (
        <div className="bg-white border border-forest-100 rounded-2xl p-5 mb-6">
          <p className="text-xs font-semibold text-forest-500 uppercase tracking-wide mb-4">{t('complaints.timeline')}</p>
          <div className="space-y-4">
            {updates.map((u, i) => (
              <div key={u.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-forest-100 flex items-center justify-center shrink-0">
                    <Clock className="w-3 h-3 text-forest-600" />
                  </div>
                  {i < updates.length - 1 && <div className="w-px flex-1 bg-forest-100 my-1" />}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${STATUS_STYLES[u.status]}`}>{t(`complaints.${u.status}`)}</span>
                    <span className="text-xs text-forest-400">{new Date(u.created_at).toLocaleDateString('en-IN')}</span>
                    <span className="text-xs text-forest-400">by {u.profiles?.full_name}</span>
                  </div>
                  {u.note && <p className="text-sm text-forest-700 mt-1">{u.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rating (only if resolved/closed and it's the creator) */}
      {(complaint.status === 'resolved' || complaint.status === 'closed') && complaint.created_by === profile?.id && (
        <div className="bg-white border border-forest-100 rounded-2xl p-5">
          <p className="text-xs font-semibold text-forest-500 uppercase tracking-wide mb-3">{t('complaints.rateResolution')}</p>
          <div className="flex gap-2">
            {[1,2,3,4,5].map(r => (
              <button key={r} onClick={() => submitRating(r)} disabled={submittingRating}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  r <= rating ? 'bg-gold-400 text-forest-900' : 'bg-forest-50 text-forest-300 hover:bg-gold-100'
                }`}>
                <Star className={`w-5 h-5 ${r <= rating ? 'fill-current' : ''}`} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
