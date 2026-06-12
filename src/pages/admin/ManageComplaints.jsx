import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import notify from '../../lib/notify'
import { MessageSquare, ArrowLeft, X, AlertCircle, ChevronRight } from 'lucide-react'

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

const STATUSES = ['open','assigned','in_progress','resolved','closed']
const CATEGORIES = ['water','electricity','security','sanitation','roads','garbage','noise','parking','maintenance','other']

export default function ManageComplaints() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [committee, setCommittee] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [selected, setSelected] = useState(null)
  const [updateForm, setUpdateForm] = useState({ status: 'open', note: '', assigned_to: '', resolution_note: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('complaints')
        .select('*, profiles!created_by(full_name, phone), assigned:profiles!assigned_to(full_name)')
        .order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name').in('role', ['admin','committee']).eq('status','approved'),
    ]).then(([{ data: c }, { data: cm }]) => {
      setComplaints(c ?? [])
      setCommittee(cm ?? [])
      setLoading(false)
    })
  }, [])

  function openUpdate(c) {
    setSelected(c)
    setUpdateForm({ status: c.status, note: '', assigned_to: c.assigned_to ?? '', resolution_note: c.resolution_note ?? '' })
  }

  async function saveUpdate() {
    setSaving(true)
    const updates = {
      status: updateForm.status,
      assigned_to: updateForm.assigned_to || null,
      resolution_note: updateForm.resolution_note.trim() || null,
      updated_at: new Date().toISOString(),
    }
    const { error: ce } = await supabase.from('complaints').update(updates).eq('id', selected.id)
    if (ce) { notify.error('Update failed', ce.message); setSaving(false); return }

    if (updateForm.note.trim()) {
      await supabase.from('complaint_updates').insert({
        complaint_id: selected.id,
        status: updateForm.status,
        note: updateForm.note.trim(),
        updated_by: profile.id,
      })
    }

    notify.success('Complaint updated')
    setSaving(false)
    setSelected(null)
    const { data } = await supabase.from('complaints')
      .select('*, profiles!created_by(full_name, phone), assigned:profiles!assigned_to(full_name)')
      .order('created_at', { ascending: false })
    setComplaints(data ?? [])
  }

  const filtered = complaints.filter(c => {
    const ms = filterStatus === 'all' || c.status === filterStatus
    const mc = filterCategory === 'all' || c.category === filterCategory
    return ms && mc
  })

  const counts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: complaints.filter(c => c.status === s).length }), {})

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/admin" className="p-2 rounded-xl text-forest-500 hover:bg-forest-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-display text-2xl font-bold text-forest-800">{t('admin.manageComplaints')}</h1>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}
            className={`rounded-xl p-3 text-center border transition-all ${filterStatus === s ? 'border-forest-600 bg-forest-700 text-white' : 'bg-white border-forest-100 hover:border-forest-300'}`}>
            <p className={`text-xl font-bold ${filterStatus === s ? 'text-white' : 'text-forest-800'}`}>{counts[s]}</p>
            <p className={`text-xs ${filterStatus === s ? 'text-white/80' : 'text-forest-500'}`}>{t(`complaints.${s}`)}</p>
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-5">
        <button onClick={() => setFilterCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterCategory === 'all' ? 'bg-forest-700 text-white' : 'bg-white border border-forest-200 text-forest-600 hover:bg-forest-50'}`}>
          All Categories
        </button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilterCategory(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterCategory === c ? 'bg-forest-700 text-white' : 'bg-white border border-forest-200 text-forest-600 hover:bg-forest-50'}`}>
            {t(`complaints.${c}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(6)].map((_,i) => <div key={i} className="h-16 bg-forest-50 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14 text-forest-400">
          <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No complaints found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <div key={c.id} className="bg-white border border-forest-100 rounded-xl p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-forest-800 text-sm truncate">{c.title}</p>
                <p className="text-xs text-forest-400 mt-0.5">
                  {t(`complaints.${c.category}`)} · {c.profiles?.full_name} · {new Date(c.created_at).toLocaleDateString('en-IN')}
                  {c.assigned?.full_name ? ` · Assigned: ${c.assigned.full_name}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${PRIORITY_STYLES[c.priority]}`}>{t(`complaints.${c.priority}`)}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[c.status]}`}>{t(`complaints.${c.status}`)}</span>
                <button onClick={() => openUpdate(c)}
                  className="px-3 py-1.5 bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold rounded-lg transition-colors">
                  Update
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Update Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-forest-100 sticky top-0 bg-white">
              <h2 className="font-display font-bold text-forest-800 text-base leading-tight flex-1 pr-2">{selected.title}</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-forest-400 hover:bg-forest-50 shrink-0"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">Status</label>
                <select value={updateForm.status} onChange={e => setUpdateForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-forest-400 bg-white">
                  {STATUSES.map(s => <option key={s} value={s}>{t(`complaints.${s}`)}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">{t('complaints.assign')}</label>
                <select value={updateForm.assigned_to} onChange={e => setUpdateForm(f => ({ ...f, assigned_to: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-forest-400 bg-white">
                  <option value="">Unassigned</option>
                  {committee.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">{t('complaints.note')}</label>
                <textarea value={updateForm.note} onChange={e => setUpdateForm(f => ({ ...f, note: e.target.value }))}
                  rows={2} placeholder="Add a status update note (optional)"
                  className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-forest-400 bg-white resize-none" />
              </div>

              {(updateForm.status === 'resolved' || updateForm.status === 'closed') && (
                <div>
                  <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">{t('complaints.resolutionNote')}</label>
                  <textarea value={updateForm.resolution_note} onChange={e => setUpdateForm(f => ({ ...f, resolution_note: e.target.value }))}
                    rows={2} placeholder="How was this resolved?"
                    className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-forest-400 bg-white resize-none" />
                </div>
              )}
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={saveUpdate} disabled={saving}
                className="flex-1 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold rounded-xl disabled:opacity-60 transition-colors text-sm">
                {saving ? 'Saving...' : t('complaints.submitUpdate')}
              </button>
              <button onClick={() => setSelected(null)}
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
