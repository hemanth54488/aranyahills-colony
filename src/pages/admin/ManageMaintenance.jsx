import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import notify from '../../lib/notify'
import { IndianRupee, Plus, ArrowLeft, CheckCircle, X, AlertCircle, Users } from 'lucide-react'

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-forest-100 text-forest-700',
  overdue: 'bg-red-100 text-red-700',
  waived: 'bg-gray-100 text-gray-500',
}

const RULES = {
  amount: v => {
    if (!v) return 'Amount is required'
    const n = Number(v)
    if (isNaN(n) || n <= 0) return 'Enter a valid positive amount'
    if (n > 100000) return 'Amount seems too large'
    return ''
  },
  period: v => {
    if (!v?.trim()) return 'Period is required (e.g. 2025-Q1 or 2025-06)'
    return ''
  },
  due_date: v => {
    if (!v) return 'Due date is required'
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

export default function ManageMaintenance() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [plots, setPlots] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [bulk, setBulk] = useState(false)
  const [form, setForm] = useState({ plot_id: '', amount: '', period: '', due_date: '', notes: '' })
  const [touched, setTouched] = useState({})
  const [saving, setSaving] = useState(false)
  const [filterPlot, setFilterPlot] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    Promise.all([
      supabase.from('maintenance_invoices').select('*, plots(plot_number)').order('created_at', { ascending: false }),
      supabase.from('plots').select('id, plot_number, status').eq('status', 'occupied').order('plot_number'),
      supabase.from('maintenance_payments').select('*, profiles(full_name)').order('created_at', { ascending: false }),
    ]).then(([{ data: inv }, { data: pl }, { data: pay }]) => {
      setInvoices(inv ?? [])
      setPlots(pl ?? [])
      setPayments(pay ?? [])
      setLoading(false)
    })
  }, [])

  const errors = {
    amount: RULES.amount(form.amount),
    period: RULES.period(form.period),
    due_date: RULES.due_date(form.due_date),
  }
  const formValid = !errors.amount && !errors.period && !errors.due_date && (bulk || form.plot_id)

  async function createInvoice() {
    setTouched({ amount: true, period: true, due_date: true })
    if (!formValid) return
    setSaving(true)

    if (bulk) {
      const rows = plots.map(p => ({
        plot_id: p.id,
        amount: Number(form.amount),
        period: form.period.trim(),
        due_date: form.due_date,
        notes: form.notes.trim() || null,
        created_by: profile.id,
      }))
      const { error } = await supabase.from('maintenance_invoices').insert(rows)
      if (error) { notify.error('Bulk create failed', error.message); setSaving(false); return }
      notify.success(`${rows.length} invoices created`)
    } else {
      const { error } = await supabase.from('maintenance_invoices').insert({
        plot_id: form.plot_id,
        amount: Number(form.amount),
        period: form.period.trim(),
        due_date: form.due_date,
        notes: form.notes.trim() || null,
        created_by: profile.id,
      })
      if (error) { notify.error('Create failed', error.message); setSaving(false); return }
      notify.success('Invoice created')
    }
    setSaving(false)
    setShowModal(false)
    setForm({ plot_id: '', amount: '', period: '', due_date: '', notes: '' })
    setTouched({})
    const { data } = await supabase.from('maintenance_invoices').select('*, plots(plot_number)').order('created_at', { ascending: false })
    setInvoices(data ?? [])
  }

  async function verifyPayment(paymentId, invoiceId) {
    const { error } = await supabase.from('maintenance_payments').update({ verified_by: profile.id, verified_at: new Date().toISOString() }).eq('id', paymentId)
    if (error) { notify.error('Verify failed', error.message); return }
    await supabase.from('maintenance_invoices').update({ status: 'paid' }).eq('id', invoiceId)
    notify.success('Payment verified')
    const [{ data: inv }, { data: pay }] = await Promise.all([
      supabase.from('maintenance_invoices').select('*, plots(plot_number)').order('created_at', { ascending: false }),
      supabase.from('maintenance_payments').select('*, profiles(full_name)').order('created_at', { ascending: false }),
    ])
    setInvoices(inv ?? [])
    setPayments(pay ?? [])
  }

  const filtered = invoices.filter(i => {
    const matchPlot = filterPlot === 'all' || i.plot_id === filterPlot
    const matchStatus = filterStatus === 'all' || i.status === filterStatus
    return matchPlot && matchStatus
  })

  const pendingPayments = payments.filter(p => !p.verified_at)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/admin" className="p-2 rounded-xl text-forest-500 hover:bg-forest-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold text-forest-800">{t('admin.manageMaintenance')}</h1>
        </div>
        <button onClick={() => { setShowModal(true); setBulk(false); setForm({ plot_id: '', amount: '', period: '', due_date: '', notes: '' }); setTouched({}) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold text-sm rounded-xl transition-colors">
          <Plus className="w-4 h-4" />{t('maintenance.createInvoice')}
        </button>
      </div>

      {/* Pending Verifications */}
      {pendingPayments.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
          <p className="font-semibold text-amber-800 text-sm mb-3">{pendingPayments.length} payment(s) awaiting verification</p>
          <div className="space-y-2">
            {pendingPayments.map(p => (
              <div key={p.id} className="bg-white border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-forest-800 text-sm">₹{Number(p.amount_paid).toLocaleString('en-IN')} · {p.payment_mode.replace('_',' ')}</p>
                  <p className="text-xs text-forest-400">{p.profiles?.full_name} · {p.transaction_ref ?? 'No ref'} · {new Date(p.payment_date).toLocaleDateString('en-IN')}</p>
                </div>
                <button onClick={() => verifyPayment(p.id, p.invoice_id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold rounded-lg transition-colors">
                  <CheckCircle className="w-3.5 h-3.5" />{t('maintenance.markVerified')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select value={filterPlot} onChange={e => setFilterPlot(e.target.value)}
          className="px-3 py-2 border border-forest-200 rounded-xl text-sm focus:outline-none focus:border-forest-400 bg-white">
          <option value="all">All Plots</option>
          {plots.map(p => <option key={p.id} value={p.id}>{p.plot_number}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-forest-200 rounded-xl text-sm focus:outline-none focus:border-forest-400 bg-white">
          <option value="all">All Status</option>
          {['pending','paid','overdue','waived'].map(s => <option key={s} value={s}>{t(`maintenance.${s}`)}</option>)}
        </select>
      </div>

      {/* Invoice table */}
      {loading ? (
        <div className="space-y-2">{[...Array(6)].map((_,i) => <div key={i} className="h-14 bg-forest-50 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14 text-forest-400">
          <IndianRupee className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No invoices found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-forest-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-forest-50 border-b border-forest-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-forest-600 uppercase tracking-wide">Plot</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-forest-600 uppercase tracking-wide">Period</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-forest-600 uppercase tracking-wide">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-forest-600 uppercase tracking-wide">Due Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-forest-600 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest-50">
              {filtered.map(inv => (
                <tr key={inv.id} className="hover:bg-forest-50/50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-forest-800">{inv.plots?.plot_number ?? '—'}</td>
                  <td className="px-4 py-3 text-forest-600">{inv.period}</td>
                  <td className="px-4 py-3 font-bold text-forest-800">₹{Number(inv.amount).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-forest-500">{new Date(inv.due_date).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[inv.status]}`}>
                      {t(`maintenance.${inv.status}`)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-forest-100">
              <h2 className="font-display font-bold text-forest-800 text-lg">{t('maintenance.createInvoice')}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-forest-400 hover:bg-forest-50"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Bulk toggle */}
              <div className="flex items-center gap-3 p-3 bg-forest-50 rounded-xl">
                <input type="checkbox" id="bulk" checked={bulk} onChange={e => setBulk(e.target.checked)} className="w-4 h-4 accent-forest-700" />
                <label htmlFor="bulk" className="text-sm font-medium text-forest-700 cursor-pointer flex items-center gap-1.5">
                  <Users className="w-4 h-4" />{t('maintenance.bulkCreate')} ({plots.length} plots)
                </label>
              </div>

              {!bulk && (
                <div>
                  <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">Plot *</label>
                  <select value={form.plot_id} onChange={e => setForm(f => ({ ...f, plot_id: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-forest-400 bg-white">
                    <option value="">Select plot...</option>
                    {plots.map(p => <option key={p.id} value={p.id}>{p.plot_number}</option>)}
                  </select>
                  {touched.plot_id && !form.plot_id && (
                    <p className="flex items-center gap-1 mt-1 text-xs text-red-600 font-medium"><AlertCircle className="w-3 h-3" />Plot is required</p>
                  )}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">{t('maintenance.period')} *</label>
                <input value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
                  onBlur={() => setTouched(p => ({ ...p, period: true }))}
                  placeholder="e.g. 2025-Q1 or 2025-06"
                  className={inputClass(touched.period, errors.period)} />
                <FieldMsg touched={touched.period} error={errors.period} />
              </div>

              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">{t('maintenance.amount')} *</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  onBlur={() => setTouched(p => ({ ...p, amount: true }))}
                  placeholder="e.g. 1500"
                  className={inputClass(touched.amount, errors.amount)} />
                <FieldMsg touched={touched.amount} error={errors.amount} />
              </div>

              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">{t('maintenance.dueDate')} *</label>
                <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                  onBlur={() => setTouched(p => ({ ...p, due_date: true }))}
                  className={inputClass(touched.due_date, errors.due_date)} />
                <FieldMsg touched={touched.due_date} error={errors.due_date} />
              </div>

              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">{t('maintenance.invoiceNotes')}</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} placeholder="Optional notes"
                  className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-forest-400 bg-white resize-none" />
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={createInvoice} disabled={saving}
                className="flex-1 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold rounded-xl disabled:opacity-60 transition-colors text-sm">
                {saving ? 'Creating...' : t('common.save')}
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
