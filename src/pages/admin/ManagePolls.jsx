import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import notify from '../../lib/notify'
import { BarChart2, Plus, ArrowLeft, Trash2, X, AlertCircle } from 'lucide-react'

const RULES = {
  title: v => {
    if (!v?.trim()) return 'Title is required'
    if (v.trim().length < 3) return 'Title too short'
    return ''
  },
}

function inputClass(touched, error) {
  const base = 'w-full px-3.5 py-2.5 border-2 rounded-xl text-sm focus:outline-none transition-all bg-white'
  if (!touched) return `${base} border-gray-200 focus:border-forest-400 focus:ring-4 focus:ring-forest-100`
  if (error) return `${base} border-red-400 bg-red-50/30 focus:border-red-400 focus:ring-4 focus:ring-red-100`
  return `${base} border-forest-400 bg-forest-50/30 focus:border-forest-500 focus:ring-4 focus:ring-forest-100`
}

export default function ManagePolls() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const [polls, setPolls] = useState([])
  const [votes, setVotes] = useState({})
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', ends_at: '', show_results: 'after_vote', options: ['',''] })
  const [touched, setTouched] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('polls').select('*, profiles(full_name)').order('created_at', { ascending: false }),
      supabase.from('poll_votes').select('poll_id, option_id'),
    ]).then(([{ data: p }, { data: v }]) => {
      setPolls(p ?? [])
      const vmap = {}
      ;(v ?? []).forEach(x => {
        if (!vmap[x.poll_id]) vmap[x.poll_id] = {}
        vmap[x.poll_id][x.option_id] = (vmap[x.poll_id][x.option_id] ?? 0) + 1
      })
      setVotes(vmap)
      setLoading(false)
    })
  }, [])

  function updateOption(i, val) {
    setForm(f => {
      const opts = [...f.options]
      opts[i] = val
      return { ...f, options: opts }
    })
  }
  function addOption() { setForm(f => ({ ...f, options: [...f.options, ''] })) }
  function removeOption(i) { setForm(f => ({ ...f, options: f.options.filter((_, idx) => idx !== i) })) }

  async function save() {
    setTouched({ title: true })
    if (RULES.title(form.title)) return
    const validOptions = form.options.filter(o => o.trim())
    if (validOptions.length < 2) { notify.warning('Add at least 2 options'); return }
    setSaving(true)
    const optionsJson = validOptions.map((text, i) => ({ id: i + 1, text }))
    const { error } = await supabase.from('polls').insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      options: optionsJson,
      ends_at: form.ends_at ? new Date(form.ends_at + 'T23:59:59').toISOString() : null,
      show_results: form.show_results,
      created_by: profile.id,
    })
    setSaving(false)
    if (error) { notify.error('Create failed', error.message); return }
    notify.success('Poll created')
    setShowModal(false)
    setForm({ title: '', description: '', ends_at: '', show_results: 'after_vote', options: ['',''] })
    setTouched({})
    const { data } = await supabase.from('polls').select('*, profiles(full_name)').order('created_at', { ascending: false })
    setPolls(data ?? [])
  }

  async function deletePoll(id) {
    if (!window.confirm('Delete this poll and all votes?')) return
    await supabase.from('polls').delete().eq('id', id)
    setPolls(p => p.filter(x => x.id !== id))
    notify.success('Poll deleted')
  }

  async function closePoll(id) {
    await supabase.from('polls').update({ ends_at: new Date().toISOString() }).eq('id', id)
    setPolls(p => p.map(x => x.id === id ? { ...x, ends_at: new Date().toISOString() } : x))
    notify.success('Poll closed')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/admin" className="p-2 rounded-xl text-forest-500 hover:bg-forest-50 transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="font-display text-2xl font-bold text-forest-800">{t('admin.managePolls')}</h1>
        <button onClick={() => setShowModal(true)} className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold text-sm rounded-xl transition-colors">
          <Plus className="w-4 h-4" />{t('polls.addPoll')}
        </button>
      </div>

      {loading ? <div className="space-y-3">{[...Array(3)].map((_,i) => <div key={i} className="h-24 bg-forest-50 rounded-2xl animate-pulse" />)}</div>
      : polls.length === 0 ? (
        <div className="text-center py-14 text-forest-400"><BarChart2 className="w-10 h-10 mx-auto mb-2 opacity-40" /><p className="text-sm">{t('polls.noPolls')}</p></div>
      ) : (
        <div className="space-y-4">
          {polls.map(poll => {
            const pollVotes = votes[poll.id] ?? {}
            const total = Object.values(pollVotes).reduce((a, b) => a + b, 0)
            const isClosed = poll.ends_at && new Date(poll.ends_at) <= new Date()
            const opts = poll.options ?? []
            return (
              <div key={poll.id} className="bg-white border border-forest-100 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-semibold text-forest-800 text-sm">{poll.title}</p>
                    <p className="text-xs text-forest-400 mt-0.5">{total} {t('polls.votes')} · {isClosed ? t('polls.closed') : t('polls.active')}</p>
                  </div>
                  <div className="flex gap-1">
                    {!isClosed && (
                      <button onClick={() => closePoll(poll.id)} className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold rounded-lg hover:bg-amber-100 transition-colors">
                        {t('polls.closePoll')}
                      </button>
                    )}
                    <button onClick={() => deletePoll(poll.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {opts.map(opt => {
                    const v = pollVotes[opt.id] ?? 0
                    const pct = total > 0 ? Math.round((v / total) * 100) : 0
                    return (
                      <div key={opt.id} className="relative bg-forest-50 rounded-lg h-8 overflow-hidden">
                        <div className="absolute inset-y-0 left-0 bg-forest-200 transition-all" style={{ width: `${pct}%` }} />
                        <div className="relative flex items-center justify-between px-3 h-full">
                          <span className="text-xs font-medium text-forest-700">{opt.text}</span>
                          <span className="text-xs text-forest-500">{v} ({pct}%)</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-forest-100 sticky top-0 bg-white">
              <h2 className="font-display font-bold text-forest-800">{t('polls.addPoll')}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-forest-400 hover:bg-forest-50"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} onBlur={() => setTouched(p => ({ ...p, title: true }))}
                  placeholder="Poll question" className={inputClass(touched.title, RULES.title(form.title))} />
                {touched.title && RULES.title(form.title) && <p className="flex items-center gap-1 mt-1 text-xs text-red-600"><AlertCircle className="w-3 h-3" />{RULES.title(form.title)}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className={`${inputClass(false, '')} resize-none`} />
              </div>
              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">{t('polls.options')} *</label>
                <div className="space-y-2">
                  {form.options.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={opt} onChange={e => updateOption(i, e.target.value)} placeholder={`Option ${i + 1}`} className={inputClass(false, '')} />
                      {form.options.length > 2 && (
                        <button onClick={() => removeOption(i)} className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl transition-colors"><X className="w-4 h-4" /></button>
                      )}
                    </div>
                  ))}
                  {form.options.length < 6 && (
                    <button onClick={addOption} className="flex items-center gap-1.5 text-sm text-forest-600 hover:text-forest-800 font-medium transition-colors">
                      <Plus className="w-4 h-4" />{t('polls.addOption')}
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">{t('polls.endsAt')}</label>
                <input type="date" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]} className={inputClass(false, '')} />
              </div>
              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">{t('polls.showResults')}</label>
                <select value={form.show_results} onChange={e => setForm(f => ({ ...f, show_results: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-forest-400 bg-white">
                  {['always','after_vote','after_close'].map(r => <option key={r} value={r}>{t(`polls.${r}`)}</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={save} disabled={saving} className="flex-1 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold rounded-xl disabled:opacity-60 transition-colors text-sm">
                {saving ? 'Creating...' : t('common.save')}
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-forest-200 text-forest-600 rounded-xl hover:bg-forest-50 transition-colors text-sm">{t('common.cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
