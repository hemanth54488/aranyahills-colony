import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import notify from '../../lib/notify'
import { Bell, Plus, ArrowLeft, Trash2, X, Pin, AlertCircle } from 'lucide-react'

const PRIORITIES = ['general','urgent','event']
const PRIORITY_STYLES = {
  urgent: 'bg-red-100 text-red-700',
  general: 'bg-blue-100 text-blue-700',
  event: 'bg-forest-100 text-forest-700',
}

const RULES = {
  title_en: v => {
    if (!v?.trim()) return 'English title is required'
    if (v.trim().length < 3) return 'Title too short'
    return ''
  },
  content_en: v => {
    if (!v?.trim()) return 'English content is required'
    return ''
  },
}

function inputClass(touched, error) {
  const base = 'w-full px-3.5 py-2.5 border-2 rounded-xl text-sm focus:outline-none transition-all bg-white'
  if (!touched) return `${base} border-gray-200 focus:border-forest-400 focus:ring-4 focus:ring-forest-100`
  if (error) return `${base} border-red-400 bg-red-50/30 focus:border-red-400 focus:ring-4 focus:ring-red-100`
  return `${base} border-forest-400 bg-forest-50/30 focus:border-forest-500 focus:ring-4 focus:ring-forest-100`
}

const EMPTY_FORM = { title_en: '', title_te: '', title_hi: '', content_en: '', content_te: '', content_hi: '', priority: 'general', is_pinned: false, expires_at: '' }

export default function ManageNotices() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [touched, setTouched] = useState({})
  const [saving, setSaving] = useState(false)

  function fetchNotices() {
    supabase.from('notices').select('*, profiles(full_name)').order('created_at', { ascending: false })
      .then(({ data }) => { setNotices(data ?? []); setLoading(false) })
  }
  useEffect(() => { fetchNotices() }, [])

  function openAdd() {
    setEditing(null); setForm(EMPTY_FORM); setTouched({}); setShowModal(true)
  }
  function openEdit(n) {
    setEditing(n)
    setForm({ title_en: n.title_en, title_te: n.title_te ?? '', title_hi: n.title_hi ?? '', content_en: n.content_en, content_te: n.content_te ?? '', content_hi: n.content_hi ?? '', priority: n.priority, is_pinned: n.is_pinned, expires_at: n.expires_at ? n.expires_at.split('T')[0] : '' })
    setTouched({}); setShowModal(true)
  }

  async function save() {
    setTouched({ title_en: true, content_en: true })
    if (RULES.title_en(form.title_en) || RULES.content_en(form.content_en)) return
    setSaving(true)
    const payload = {
      title_en: form.title_en.trim(), title_te: form.title_te.trim() || null, title_hi: form.title_hi.trim() || null,
      content_en: form.content_en.trim(), content_te: form.content_te.trim() || null, content_hi: form.content_hi.trim() || null,
      priority: form.priority, is_pinned: form.is_pinned,
      expires_at: form.expires_at ? new Date(form.expires_at + 'T23:59:59').toISOString() : null,
    }
    const { error } = editing
      ? await supabase.from('notices').update(payload).eq('id', editing.id)
      : await supabase.from('notices').insert({ ...payload, created_by: profile.id })
    setSaving(false)
    if (error) { notify.error('Save failed', error.message); return }
    notify.success(editing ? 'Notice updated' : 'Notice posted')
    setShowModal(false); fetchNotices()
  }

  async function deleteNotice(id) {
    if (!window.confirm('Delete this notice?')) return
    await supabase.from('notices').delete().eq('id', id)
    setNotices(n => n.filter(x => x.id !== id))
    notify.success('Deleted')
  }

  async function togglePin(id, current) {
    await supabase.from('notices').update({ is_pinned: !current }).eq('id', id)
    setNotices(n => n.map(x => x.id === id ? { ...x, is_pinned: !current } : x))
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/admin" className="p-2 rounded-xl text-forest-500 hover:bg-forest-50 transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="font-display text-2xl font-bold text-forest-800">{t('admin.manageNotices')}</h1>
        <button onClick={openAdd} className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold text-sm rounded-xl transition-colors">
          <Plus className="w-4 h-4" />{t('admin.postNotice')}
        </button>
      </div>

      {loading ? <div className="space-y-2">{[...Array(5)].map((_,i) => <div key={i} className="h-16 bg-forest-50 rounded-xl animate-pulse" />)}</div>
      : notices.length === 0 ? (
        <div className="text-center py-14 text-forest-400"><Bell className="w-10 h-10 mx-auto mb-2 opacity-40" /><p className="text-sm">No notices yet</p></div>
      ) : (
        <div className="space-y-2">
          {notices.map(n => (
            <div key={n.id} className={`bg-white border rounded-xl p-4 flex items-center gap-3 ${n.priority === 'urgent' ? 'border-red-200' : 'border-forest-100'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  {n.is_pinned && <Pin className="w-3 h-3 text-gold-500" />}
                  <p className="font-semibold text-forest-800 text-sm truncate">{n.title_en}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${PRIORITY_STYLES[n.priority]}`}>{t(`notices.${n.priority}`)}</span>
                  <span className="text-xs text-forest-400">{new Date(n.created_at).toLocaleDateString('en-IN')}</span>
                  {n.expires_at && <span className="text-xs text-amber-500">Expires {new Date(n.expires_at).toLocaleDateString('en-IN')}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => togglePin(n.id, n.is_pinned)} title={n.is_pinned ? 'Unpin' : 'Pin'}
                  className={`p-1.5 rounded-lg transition-colors ${n.is_pinned ? 'text-gold-500 bg-gold-50' : 'text-forest-300 hover:text-gold-500 hover:bg-gold-50'}`}>
                  <Pin className="w-4 h-4" />
                </button>
                <button onClick={() => openEdit(n)} className="px-3 py-1.5 bg-forest-50 border border-forest-200 text-forest-700 text-xs font-semibold rounded-lg hover:bg-forest-100 transition-colors">{t('common.edit')}</button>
                <button onClick={() => deleteNotice(n.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-forest-100 sticky top-0 bg-white">
              <h2 className="font-display font-bold text-forest-800">{editing ? 'Edit Notice' : t('admin.postNotice')}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-forest-400 hover:bg-forest-50"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Priority + Pin */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-forest-400 bg-white">
                    {PRIORITIES.map(p => <option key={p} value={p}>{t(`notices.${p}`)}</option>)}
                  </select>
                </div>
                <div className="flex items-end pb-0.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_pinned} onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))} className="w-4 h-4 accent-forest-700" />
                    <span className="text-sm text-forest-700 font-medium flex items-center gap-1"><Pin className="w-3.5 h-3.5" />Pin</span>
                  </label>
                </div>
              </div>

              {/* English */}
              <div className="space-y-3 bg-forest-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-forest-600 uppercase tracking-wide">English *</p>
                <div>
                  <input value={form.title_en} onChange={e => setForm(f => ({ ...f, title_en: e.target.value }))} onBlur={() => setTouched(p => ({ ...p, title_en: true }))}
                    placeholder="Title (English)" className={inputClass(touched.title_en, RULES.title_en(form.title_en))} />
                  {touched.title_en && RULES.title_en(form.title_en) && <p className="flex items-center gap-1 mt-1 text-xs text-red-600"><AlertCircle className="w-3 h-3" />{RULES.title_en(form.title_en)}</p>}
                </div>
                <textarea value={form.content_en} onChange={e => setForm(f => ({ ...f, content_en: e.target.value }))} onBlur={() => setTouched(p => ({ ...p, content_en: true }))}
                  rows={3} placeholder="Content (English)" className={`${inputClass(touched.content_en, RULES.content_en(form.content_en))} resize-none`} />
                {touched.content_en && RULES.content_en(form.content_en) && <p className="flex items-center gap-1 mt-1 text-xs text-red-600"><AlertCircle className="w-3 h-3" />{RULES.content_en(form.content_en)}</p>}
              </div>

              {/* Telugu */}
              <div className="space-y-3 bg-earth-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-earth-600 uppercase tracking-wide">తెలుగు (optional)</p>
                <input value={form.title_te} onChange={e => setForm(f => ({ ...f, title_te: e.target.value }))} placeholder="శీర్షిక (తెలుగు)" className={inputClass(false, '')} />
                <textarea value={form.content_te} onChange={e => setForm(f => ({ ...f, content_te: e.target.value }))} rows={2} placeholder="విషయం (తెలుగు)" className={`${inputClass(false, '')} resize-none`} />
              </div>

              {/* Hindi */}
              <div className="space-y-3 bg-blue-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">हिंदी (optional)</p>
                <input value={form.title_hi} onChange={e => setForm(f => ({ ...f, title_hi: e.target.value }))} placeholder="शीर्षक (हिंदी)" className={inputClass(false, '')} />
                <textarea value={form.content_hi} onChange={e => setForm(f => ({ ...f, content_hi: e.target.value }))} rows={2} placeholder="सामग्री (हिंदी)" className={`${inputClass(false, '')} resize-none`} />
              </div>

              {/* Expiry */}
              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">Expires On (optional)</label>
                <input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]} className={inputClass(false, '')} />
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
