import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import notify from '../lib/notify'
import { MessageSquare, Plus, ChevronRight, X, AlertCircle } from 'lucide-react'

const CATEGORIES = ['water','electricity','security','sanitation','roads','garbage','noise','parking','maintenance','other']
const PRIORITIES = ['low','medium','high','urgent']

const STATUS_STYLES = {
  open: 'bg-blue-100 text-blue-700',
  assigned: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-purple-100 text-purple-700',
  resolved: 'bg-forest-100 text-forest-700',
  closed: 'bg-gray-100 text-gray-600',
}
const PRIORITY_STYLES = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

const RULES = {
  title: v => {
    if (!v?.trim()) return 'Title is required'
    if (v.trim().length < 5) return 'Title must be at least 5 characters'
    if (v.trim().length > 120) return 'Title too long (max 120 characters)'
    return ''
  },
  description: v => {
    if (!v?.trim()) return ''
    if (v.trim().length > 1000) return 'Description too long (max 1000 characters)'
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

export default function Complaints() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', category: 'water', priority: 'medium' })
  const [touched, setTouched] = useState({})
  const [submitting, setSubmitting] = useState(false)

  function fetchComplaints() {
    supabase
      .from('complaints')
      .select('*')
      .eq('created_by', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setComplaints(data ?? []); setLoading(false) })
  }

  useEffect(() => { if (profile?.id) fetchComplaints() }, [profile?.id])

  const errors = {
    title: RULES.title(form.title),
    description: RULES.description(form.description),
  }
  const formValid = !errors.title && !errors.description

  async function submitComplaint() {
    setTouched({ title: true, description: true })
    if (!formValid) return
    setSubmitting(true)
    const { error } = await supabase.from('complaints').insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      category: form.category,
      priority: form.priority,
      plot_id: profile.plot_id,
      created_by: profile.id,
    })
    setSubmitting(false)
    if (error) { notify.error('Submit failed', error.message); return }
    notify.success('Complaint submitted successfully')
    setShowModal(false)
    setForm({ title: '', description: '', category: 'water', priority: 'medium' })
    setTouched({})
    fetchComplaints()
  }

  const STATUS_FILTERS = ['all','open','assigned','in_progress','resolved','closed']
  const filtered = filter === 'all' ? complaints : complaints.filter(c => c.status === filter)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-forest-800">{t('complaints.title')}</h1>
          <p className="text-forest-500 text-sm mt-1">{t('complaints.myComplaints')}</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold text-sm rounded-xl transition-colors">
          <Plus className="w-4 h-4" />{t('complaints.raise')}
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {STATUS_FILTERS.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === s ? 'bg-forest-700 text-white' : 'bg-white border border-forest-200 text-forest-600 hover:bg-forest-50'}`}>
            {s === 'all' ? t('complaints.filterAll') : t(`complaints.${s}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_,i) => <div key={i} className="h-16 bg-forest-50 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14 text-forest-400">
          <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">{t('complaints.noComplaints')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <Link key={c.id} to={`/complaints/${c.id}`}
              className="block bg-white border border-forest-100 rounded-xl p-4 hover:shadow-sm hover:border-forest-300 transition-all group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-forest-800 text-sm truncate">{c.title}</p>
                  <p className="text-xs text-forest-400 mt-0.5">{t(`complaints.${c.category}`)} · {new Date(c.created_at).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${PRIORITY_STYLES[c.priority]}`}>
                    {t(`complaints.${c.priority}`)}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[c.status]}`}>
                    {t(`complaints.${c.status}`)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-forest-300 group-hover:text-forest-600 transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* New Complaint Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-forest-100 sticky top-0 bg-white">
              <h2 className="font-display font-bold text-forest-800 text-lg">{t('complaints.raise')}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-forest-400 hover:bg-forest-50"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">{t('complaints.complaintTitle')} *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  onBlur={() => setTouched(p => ({ ...p, title: true }))}
                  placeholder="Brief title of the issue"
                  className={inputClass(touched.title, errors.title)} />
                <FieldMsg touched={touched.title} error={errors.title} />
              </div>

              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">{t('complaints.category')}</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-forest-400 bg-white">
                  {CATEGORIES.map(c => <option key={c} value={c}>{t(`complaints.${c}`)}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">{t('complaints.priority')}</label>
                <div className="flex gap-2">
                  {PRIORITIES.map(p => (
                    <button key={p} type="button" onClick={() => setForm(f => ({ ...f, priority: p }))}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${form.priority === p ? 'border-forest-600 bg-forest-700 text-white' : 'border-forest-200 text-forest-600 hover:bg-forest-50'}`}>
                      {t(`complaints.${p}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">{t('complaints.description')}</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  onBlur={() => setTouched(p => ({ ...p, description: true }))}
                  rows={3} placeholder="Describe the issue in detail..."
                  className={`${inputClass(touched.description, errors.description)} resize-none`} />
                <FieldMsg touched={touched.description} error={errors.description} />
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={submitComplaint} disabled={submitting}
                className="flex-1 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold rounded-xl disabled:opacity-60 transition-colors text-sm">
                {submitting ? 'Submitting...' : t('common.submit')}
              </button>
              <button onClick={() => { setShowModal(false); setTouched({}) }}
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
