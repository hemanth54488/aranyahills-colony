import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import notify from '../lib/notify'
import { IndianRupee, CheckCircle, Clock, AlertTriangle, X, AlertCircle } from 'lucide-react'

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  paid: 'bg-forest-100 text-forest-700 border-forest-200',
  overdue: 'bg-red-100 text-red-700 border-red-200',
  waived: 'bg-gray-100 text-gray-500 border-gray-200',
}
const STATUS_ICONS = {
  pending: Clock,
  paid: CheckCircle,
  overdue: AlertTriangle,
  waived: X,
}

const PAYMENT_MODES = ['upi','cash','bank_transfer','cheque']

const RULES = {
  transaction_ref: v => {
    if (!v?.trim()) return ''
    return ''
  },
  payment_date: v => {
    if (!v) return 'Payment date is required'
    return ''
  },
}

function inputClass(touched, error) {
  const base = 'w-full px-3.5 py-2.5 border-2 rounded-xl text-sm focus:outline-none transition-all bg-white'
  if (!touched) return `${base} border-gray-200 focus:border-forest-400 focus:ring-4 focus:ring-forest-100`
  if (error) return `${base} border-red-400 bg-red-50/30 focus:border-red-400 focus:ring-4 focus:ring-red-100`
  return `${base} border-forest-400 bg-forest-50/30 focus:border-forest-500 focus:ring-4 focus:ring-forest-100`
}

export default function Maintenance() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('dues')
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [payForm, setPayForm] = useState({ payment_mode: 'upi', transaction_ref: '', payment_date: new Date().toISOString().split('T')[0] })
  const [payTouched, setPayTouched] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!profile?.plot_id) { setLoading(false); return }
    Promise.all([
      supabase.from('maintenance_invoices').select('*').eq('plot_id', profile.plot_id).order('created_at', { ascending: false }),
      supabase.from('maintenance_payments').select('*').eq('plot_id', profile.plot_id).order('created_at', { ascending: false }),
    ]).then(([{ data: inv }, { data: pay }]) => {
      setInvoices(inv ?? [])
      setPayments(pay ?? [])
      setLoading(false)
    })
  }, [profile?.plot_id])

  const pendingInvoices = invoices.filter(i => i.status === 'pending' || i.status === 'overdue')
  const totalDue = pendingInvoices.reduce((s, i) => s + Number(i.amount), 0)

  async function submitPayment() {
    setPayTouched({ payment_date: true })
    if (!payForm.payment_date) return
    setSubmitting(true)
    const { error } = await supabase.from('maintenance_payments').insert({
      invoice_id: selectedInvoice.id,
      plot_id: profile.plot_id,
      amount_paid: selectedInvoice.amount,
      payment_date: payForm.payment_date,
      payment_mode: payForm.payment_mode,
      transaction_ref: payForm.transaction_ref.trim() || null,
    })
    if (error) {
      notify.error('Payment submission failed', error.message)
      setSubmitting(false)
      return
    }
    // Update invoice status to paid
    await supabase.from('maintenance_invoices').update({ status: 'paid' }).eq('id', selectedInvoice.id)
    notify.success(t('maintenance.paymentSubmitted'))
    setSelectedInvoice(null)
    setPayForm({ payment_mode: 'upi', transaction_ref: '', payment_date: new Date().toISOString().split('T')[0] })
    setPayTouched({})
    setSubmitting(false)
    // Refresh
    const [{ data: inv }, { data: pay }] = await Promise.all([
      supabase.from('maintenance_invoices').select('*').eq('plot_id', profile.plot_id).order('created_at', { ascending: false }),
      supabase.from('maintenance_payments').select('*').eq('plot_id', profile.plot_id).order('created_at', { ascending: false }),
    ])
    setInvoices(inv ?? [])
    setPayments(pay ?? [])
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-forest-800">{t('maintenance.title')}</h1>
        <p className="text-forest-500 text-sm mt-1">{profile?.plots?.plot_number}</p>
      </div>

      {/* Summary card */}
      {totalDue > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-amber-50 border border-red-200 rounded-2xl p-5 mb-6 flex items-center justify-between">
          <div>
            <p className="text-red-700 font-semibold text-sm">Outstanding Dues</p>
            <p className="text-red-800 font-display font-bold text-2xl mt-0.5">₹{totalDue.toLocaleString('en-IN')}</p>
            <p className="text-red-500 text-xs mt-0.5">{pendingInvoices.length} invoice(s) pending</p>
          </div>
          <AlertTriangle className="w-10 h-10 text-red-300" />
        </div>
      )}
      {totalDue === 0 && !loading && (
        <div className="bg-forest-50 border border-forest-200 rounded-2xl p-5 mb-6 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-forest-500 shrink-0" />
          <p className="text-forest-700 font-semibold text-sm">{t('maintenance.allClear')}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-forest-50 p-1 rounded-xl mb-6 border border-forest-100">
        {[['dues', t('maintenance.myDues')], ['history', t('maintenance.paymentHistory')]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tab === k ? 'bg-white text-forest-800 shadow-sm' : 'text-forest-500 hover:text-forest-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_,i) => <div key={i} className="h-16 bg-forest-50 rounded-xl animate-pulse" />)}</div>
      ) : (
        <>
          {tab === 'dues' && (
            <div className="space-y-3">
              {invoices.filter(i => i.status !== 'paid').length === 0 ? (
                <div className="text-center py-14 text-forest-400">
                  <IndianRupee className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">{t('maintenance.noDues')}</p>
                </div>
              ) : invoices.filter(i => i.status !== 'paid').map(inv => {
                const Icon = STATUS_ICONS[inv.status]
                return (
                  <div key={inv.id} className="bg-white border border-forest-100 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 shrink-0 ${inv.status === 'overdue' ? 'text-red-400' : 'text-amber-400'}`} />
                      <div>
                        <p className="font-semibold text-forest-800 text-sm">{inv.period}</p>
                        <p className="text-xs text-forest-400">Due: {new Date(inv.due_date).toLocaleDateString('en-IN')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-forest-800">₹{Number(inv.amount).toLocaleString('en-IN')}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${STATUS_STYLES[inv.status]}`}>
                          {t(`maintenance.${inv.status}`)}
                        </span>
                      </div>
                      {(inv.status === 'pending' || inv.status === 'overdue') && (
                        <button onClick={() => { setSelectedInvoice(inv); setPayTouched({}) }}
                          className="px-3 py-1.5 bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap">
                          {t('maintenance.markPaid')}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {tab === 'history' && (
            <div className="space-y-3">
              {payments.length === 0 ? (
                <div className="text-center py-14 text-forest-400">
                  <IndianRupee className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No payment history</p>
                </div>
              ) : payments.map(p => (
                <div key={p.id} className="bg-white border border-forest-100 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-forest-800 text-sm">{new Date(p.payment_date).toLocaleDateString('en-IN')}</p>
                    <p className="text-xs text-forest-400">{p.payment_mode.replace('_',' ')} {p.transaction_ref ? `· ${p.transaction_ref}` : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-forest-700">₹{Number(p.amount_paid).toLocaleString('en-IN')}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${p.verified_at ? 'bg-forest-100 text-forest-700 border-forest-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                      {p.verified_at ? 'Verified' : 'Pending Verification'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Mark as Paid Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-forest-100">
              <h2 className="font-display font-bold text-forest-800 text-lg">{t('maintenance.markPaid')}</h2>
              <button onClick={() => setSelectedInvoice(null)} className="p-1.5 rounded-lg text-forest-400 hover:bg-forest-50">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-forest-50 rounded-xl p-3">
                <p className="text-sm font-semibold text-forest-700">{selectedInvoice.period}</p>
                <p className="text-xl font-display font-bold text-forest-800 mt-1">₹{Number(selectedInvoice.amount).toLocaleString('en-IN')}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">{t('maintenance.paymentMode')}</label>
                <select value={payForm.payment_mode} onChange={e => setPayForm(f => ({ ...f, payment_mode: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-forest-400 bg-white">
                  {PAYMENT_MODES.map(m => <option key={m} value={m}>{t(`maintenance.${m}`)}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">{t('maintenance.transactionRef')}</label>
                <input value={payForm.transaction_ref} onChange={e => setPayForm(f => ({ ...f, transaction_ref: e.target.value }))}
                  placeholder="e.g. UPI ref / cheque no."
                  className={inputClass(false, '')} />
              </div>

              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">{t('maintenance.paymentDate')} *</label>
                <input type="date" value={payForm.payment_date} onChange={e => setPayForm(f => ({ ...f, payment_date: e.target.value }))}
                  onBlur={() => setPayTouched(p => ({ ...p, payment_date: true }))}
                  max={new Date().toISOString().split('T')[0]}
                  className={inputClass(payTouched.payment_date, !payForm.payment_date ? 'Required' : '')} />
                {payTouched.payment_date && !payForm.payment_date && (
                  <p className="flex items-center gap-1 mt-1 text-xs text-red-600 font-medium">
                    <AlertCircle className="w-3 h-3" />Payment date is required
                  </p>
                )}
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={submitPayment} disabled={submitting}
                className="flex-1 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold rounded-xl disabled:opacity-60 transition-colors text-sm">
                {submitting ? 'Submitting...' : t('maintenance.submitPayment')}
              </button>
              <button onClick={() => setSelectedInvoice(null)}
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
