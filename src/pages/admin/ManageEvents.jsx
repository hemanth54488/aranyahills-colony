import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import notify from '../../lib/notify'
import { CalendarDays, Plus, ArrowLeft, Trash2, X, AlertCircle } from 'lucide-react'

const RULES = {
  title: v => {
    if (!v?.trim()) return 'Title is required'
    if (v.trim().length < 3) return 'Title too short'
    return ''
  },
  event_date: v => (!v ? 'Event date is required' : ''),
}

function inputClass(touched, error) {
  const base = 'w-full px-3.5 py-2.5 border-2 rounded-xl text-sm focus:outline-none transition-all bg-white'
  if (!touched) return `${base} border-gray-200 focus:border-forest-400 focus:ring-4 focus:ring-forest-100`
  if (error) return `${base} border-red-400 bg-red-50/30 focus:border-red-400 focus:ring-4 focus:ring-red-100`
  return `${base} border-forest-400 bg-forest-50/30 focus:border-forest-500 focus:ring-4 focus:ring-forest-100`
}

export default function ManageEvents() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', event_date: '', start_time: '', end_time: '', location: '', image_url: '' })
  const [touched, setTouched] = useState({})
  const [saving, setSaving] = useState(false)

  function fetchEvents() {
    supabase.from('events').select('*').order('event_date', { ascending: false })
      .then(({ data }) => { setEvents(data ?? []); setLoading(false) })
  }
  useEffect(() => { fetchEvents() }, [])

  function openAdd() {
    setEditing(null)
    setForm({ title: '', description: '', event_date: '', start_time: '', end_time: '', location: '', image_url: '' })
    setTouched({})
    setShowModal(true)
  }

  function openEdit(e) {
    setEditing(e)
    setForm({ title: e.title, description: e.description ?? '', event_date: e.event_date, start_time: e.start_time ?? '', end_time: e.end_time ?? '', location: e.location ?? '', image_url: e.image_url ?? '' })
    setTouched({})
    setShowModal(true)
  }

  async function save() {
    setTouched({ title: true, event_date: true })
    if (RULES.title(form.title) || RULES.event_date(form.event_date)) return
    setSaving(true)
    const payload = { title: form.title.trim(), description: form.description.trim() || null, event_date: form.event_date, start_time: form.start_time || null, end_time: form.end_time || null, location: form.location.trim() || null, image_url: form.image_url.trim() || null }
    const { error } = editing
      ? await supabase.from('events').update(payload).eq('id', editing.id)
      : await supabase.from('events').insert({ ...payload, created_by: profile.id })
    setSaving(false)
    if (error) { notify.error('Save failed', error.message); return }
    notify.success(editing ? 'Event updated' : 'Event created')
    setShowModal(false)
    fetchEvents()
  }

  async function deleteEvent(id) {
    if (!window.confirm('Delete this event?')) return
    await supabase.from('events').delete().eq('id', id)
    setEvents(e => e.filter(x => x.id !== id))
    notify.success('Deleted')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/admin" className="p-2 rounded-xl text-forest-500 hover:bg-forest-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-display text-2xl font-bold text-forest-800">{t('admin.manageEvents')}</h1>
        <button onClick={openAdd} className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold text-sm rounded-xl transition-colors">
          <Plus className="w-4 h-4" />{t('events.addEvent')}
        </button>
      </div>

      {loading ? <div className="space-y-2">{[...Array(4)].map((_,i) => <div key={i} className="h-14 bg-forest-50 rounded-xl animate-pulse" />)}</div>
      : events.length === 0 ? (
        <div className="text-center py-14 text-forest-400"><CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-40" /><p className="text-sm">{t('events.noEvents')}</p></div>
      ) : (
        <div className="space-y-2">
          {events.map(e => (
            <div key={e.id} className="bg-white border border-forest-100 rounded-xl p-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-forest-800 text-sm">{e.title}</p>
                <p className="text-xs text-forest-400">{new Date(e.event_date).toLocaleDateString('en-IN')} {e.start_time ? `· ${e.start_time}` : ''} {e.location ? `· ${e.location}` : ''}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(e)} className="px-3 py-1.5 bg-forest-50 border border-forest-200 text-forest-700 text-xs font-semibold rounded-lg hover:bg-forest-100 transition-colors">{t('common.edit')}</button>
                <button onClick={() => deleteEvent(e.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-forest-100 sticky top-0 bg-white">
              <h2 className="font-display font-bold text-forest-800">{editing ? 'Edit Event' : t('events.addEvent')}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-forest-400 hover:bg-forest-50"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} onBlur={() => setTouched(p => ({ ...p, title: true }))}
                  placeholder="Event title" className={inputClass(touched.title, RULES.title(form.title))} />
                {touched.title && RULES.title(form.title) && <p className="flex items-center gap-1 mt-1 text-xs text-red-600"><AlertCircle className="w-3 h-3" />{RULES.title(form.title)}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">Date *</label>
                <input type="date" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} onBlur={() => setTouched(p => ({ ...p, event_date: true }))}
                  className={inputClass(touched.event_date, RULES.event_date(form.event_date))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">Start Time</label>
                  <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} className={inputClass(false, '')} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">End Time</label>
                  <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} className={inputClass(false, '')} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">Location</label>
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Community Hall" className={inputClass(false, '')} />
              </div>
              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className={`${inputClass(false, '')} resize-none`} />
              </div>
              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">Image URL</label>
                <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." className={inputClass(false, '')} />
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={save} disabled={saving} className="flex-1 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold rounded-xl disabled:opacity-60 transition-colors text-sm">
                {saving ? 'Saving...' : t('common.save')}
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-forest-200 text-forest-600 rounded-xl hover:bg-forest-50 transition-colors text-sm">{t('common.cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
