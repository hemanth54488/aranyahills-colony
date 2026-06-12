import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import notify from '../lib/notify'
import { UserCheck, Plus, X, Copy, Check, AlertCircle } from 'lucide-react'

const STATUS_STYLES = {
  pre_approved: 'bg-blue-100 text-blue-700',
  entered: 'bg-forest-100 text-forest-700',
  exited: 'bg-gray-100 text-gray-600',
  expired: 'bg-amber-100 text-amber-700',
  denied: 'bg-red-100 text-red-700',
}

const RULES = {
  visitor_name: v => {
    if (!v?.trim()) return 'Visitor name is required'
    if (v.trim().length < 2) return 'Name too short'
    return ''
  },
  expected_date: v => {
    if (!v) return 'Expected date is required'
    return ''
  },
  purpose: v => {
    if (!v?.trim()) return 'Purpose is required'
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

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }
  return (
    <button onClick={copy} className="p-1.5 rounded-lg text-forest-400 hover:text-forest-600 hover:bg-forest-50 transition-colors" title="Copy code">
      {copied ? <Check className="w-3.5 h-3.5 text-forest-600" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

export default function Visitors() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const [visitors, setVisitors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ visitor_name: '', visitor_phone: '', purpose: '', expected_date: '', vehicle_number: '' })
  const [touched, setTouched] = useState({})
  const [submitting, setSubmitting] = useState(false)

  function fetchVisitors() {
    supabase.from('visitors').select('*').eq('approved_by', profile.id).order('expected_date', { ascending: false })
      .then(({ data }) => { setVisitors(data ?? []); setLoading(false) })
  }

  useEffect(() => { if (profile?.id) fetchVisitors() }, [profile?.id])

  const errors = {
    visitor_name: RULES.visitor_name(form.visitor_name),
    expected_date: RULES.expected_date(form.expected_date),
    purpose: RULES.purpose(form.purpose),
  }
  const formValid = !Object.values(errors).some(Boolean)

  async function addVisitor() {
    setTouched({ visitor_name: true, expected_date: true, purpose: true })
    if (!formValid) return
    if (!profile.plot_id) { notify.error('No plot assigned to your account'); return }
    setSubmitting(true)
    const { error } = await supabase.from('visitors').insert({
      visitor_name: form.visitor_name.trim(),
      visitor_phone: form.visitor_phone.trim() || null,
      purpose: form.purpose.trim(),
      expected_date: form.expected_date,
      vehicle_number: form.vehicle_number.trim().toUpperCase() || null,
      plot_id: profile.plot_id,
      approved_by: profile.id,
    })
    setSubmitting(false)
    if (error) { notify.error('Failed to add visitor', error.message); return }
    notify.success('Visitor added. Share the gate pass code with them.')
    setShowModal(false)
    setForm({ visitor_name: '', visitor_phone: '', purpose: '', expected_date: '', vehicle_number: '' })
    setTouched({})
    fetchVisitors()
  }

  async function deleteVisitor(id) {
    if (!window.confirm('Remove this visitor entry?')) return
    await supabase.from('visitors').delete().eq('id', id)
    setVisitors(v => v.filter(x => x.id !== id))
    notify.success('Removed')
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-forest-800">{t('visitors.title')}</h1>
          <p className="text-forest-500 text-sm mt-1">{t('visitors.myVisitors')}</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold text-sm rounded-xl transition-colors">
          <Plus className="w-4 h-4" />{t('visitors.addVisitor')}
        </button>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-6 text-blue-700 text-xs">
        Share the 8-character gate pass code with your visitor. Security staff will verify it at the gate.
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_,i) => <div key={i} className="h-20 bg-forest-50 rounded-xl animate-pulse" />)}</div>
      ) : visitors.length === 0 ? (
        <div className="text-center py-14 text-forest-400">
          <UserCheck className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">{t('visitors.noVisitors')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visitors.map(v => (
            <div key={v.id} className="bg-white border border-forest-100 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold text-forest-800">{v.visitor_name}</p>
                  <p className="text-xs text-forest-400 mt-0.5">
                    {v.purpose} · {new Date(v.expected_date).toLocaleDateString('en-IN')}
                    {v.visitor_phone ? ` · ${v.visitor_phone}` : ''}
                    {v.vehicle_number ? ` · ${v.vehicle_number}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[v.status]}`}>
                    {t(`visitors.${v.status}`)}
                  </span>
                  {v.status === 'pre_approved' && (
                    <button onClick={() => deleteVisitor(v.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              {/* Gate pass code */}
              <div className="bg-forest-50 border border-forest-200 rounded-lg px-3 py-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-forest-500 uppercase tracking-wide">{t('visitors.gatePass')}</span>
                  <p className="font-mono font-bold text-forest-800 text-lg tracking-widest">{v.gate_pass_code}</p>
                </div>
                <CopyButton text={v.gate_pass_code} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Visitor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-forest-100 sticky top-0 bg-white">
              <h2 className="font-display font-bold text-forest-800 text-lg">{t('visitors.addVisitor')}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-forest-400 hover:bg-forest-50"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">{t('visitors.visitorName')} *</label>
                <input value={form.visitor_name} onChange={e => setForm(f => ({ ...f, visitor_name: e.target.value }))}
                  onBlur={() => setTouched(p => ({ ...p, visitor_name: true }))}
                  placeholder="Full name of visitor"
                  className={inputClass(touched.visitor_name, errors.visitor_name)} />
                <FieldMsg touched={touched.visitor_name} error={errors.visitor_name} />
              </div>
              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">{t('visitors.visitorPhone')}</label>
                <input value={form.visitor_phone} onChange={e => setForm(f => ({ ...f, visitor_phone: e.target.value }))}
                  placeholder="10-digit mobile (optional)" maxLength={10}
                  className={inputClass(false, '')} />
              </div>
              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">{t('visitors.purpose')} *</label>
                <input value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
                  onBlur={() => setTouched(p => ({ ...p, purpose: true }))}
                  placeholder="e.g. Visit, Delivery, Work"
                  className={inputClass(touched.purpose, errors.purpose)} />
                <FieldMsg touched={touched.purpose} error={errors.purpose} />
              </div>
              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">{t('visitors.expectedDate')} *</label>
                <input type="date" value={form.expected_date} onChange={e => setForm(f => ({ ...f, expected_date: e.target.value }))}
                  onBlur={() => setTouched(p => ({ ...p, expected_date: true }))}
                  min={new Date().toISOString().split('T')[0]}
                  className={inputClass(touched.expected_date, errors.expected_date)} />
                <FieldMsg touched={touched.expected_date} error={errors.expected_date} />
              </div>
              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">{t('visitors.vehicleNumber')}</label>
                <input value={form.vehicle_number} onChange={e => setForm(f => ({ ...f, vehicle_number: e.target.value.toUpperCase() }))}
                  placeholder="e.g. TS09AB1234 (optional)"
                  className={inputClass(false, '')} />
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={addVisitor} disabled={submitting}
                className="flex-1 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold rounded-xl disabled:opacity-60 transition-colors text-sm">
                {submitting ? 'Adding...' : t('common.add')}
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
