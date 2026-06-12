import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import notify from '../lib/notify'
import { ShieldCheck, LogIn, LogOut, Search, Clock } from 'lucide-react'

const STATUS_STYLES = {
  pre_approved: 'bg-blue-100 text-blue-700',
  entered: 'bg-forest-100 text-forest-700',
  exited: 'bg-gray-100 text-gray-600',
  expired: 'bg-amber-100 text-amber-700',
  denied: 'bg-red-100 text-red-700',
}

export default function Security() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const [code, setCode] = useState('')
  const [visitor, setVisitor] = useState(null)
  const [searching, setSearching] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [logging, setLogging] = useState(false)
  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => {
    supabase.from('visitors')
      .select('*, plots(plot_number)')
      .in('status', ['entered','exited'])
      .order('entry_time', { ascending: false })
      .limit(20)
      .then(({ data }) => setRecentActivity(data ?? []))
  }, [])

  async function verifyCode() {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed || trimmed.length < 4) { notify.warning('Enter a valid gate pass code'); return }
    setSearching(true)
    setVisitor(null)
    setNotFound(false)
    const { data } = await supabase.from('visitors').select('*, plots(plot_number)').eq('gate_pass_code', trimmed).single()
    setSearching(false)
    if (!data) { setNotFound(true); return }
    setVisitor(data)
  }

  async function logEntry() {
    if (!visitor) return
    setLogging(true)
    const { error } = await supabase.from('visitors').update({ status: 'entered', entry_time: new Date().toISOString() }).eq('id', visitor.id)
    setLogging(false)
    if (error) { notify.error('Log failed', error.message); return }
    notify.success('Entry logged')
    setVisitor(v => ({ ...v, status: 'entered', entry_time: new Date().toISOString() }))
    refreshRecent()
  }

  async function logExit() {
    if (!visitor) return
    setLogging(true)
    const { error } = await supabase.from('visitors').update({ status: 'exited', exit_time: new Date().toISOString() }).eq('id', visitor.id)
    setLogging(false)
    if (error) { notify.error('Log failed', error.message); return }
    notify.success('Exit logged')
    setVisitor(v => ({ ...v, status: 'exited', exit_time: new Date().toISOString() }))
    refreshRecent()
  }

  function refreshRecent() {
    supabase.from('visitors').select('*, plots(plot_number)').in('status', ['entered','exited']).order('entry_time', { ascending: false }).limit(20)
      .then(({ data }) => setRecentActivity(data ?? []))
  }

  function reset() { setCode(''); setVisitor(null); setNotFound(false) }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-forest-800">{t('security.title')}</h1>
        <p className="text-forest-500 text-sm mt-1">Aranya Hills Colony — Gate Management</p>
      </div>

      {/* Verify section */}
      <div className="bg-white border border-forest-100 rounded-2xl p-6 mb-6">
        <p className="text-xs font-semibold text-forest-500 uppercase tracking-wide mb-4">{t('security.verifyPass')}</p>
        <div className="flex gap-3">
          <input
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setNotFound(false); setVisitor(null) }}
            onKeyDown={e => e.key === 'Enter' && verifyCode()}
            placeholder={t('security.enterCode')}
            maxLength={8}
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-mono font-bold tracking-widest focus:outline-none focus:border-forest-400 focus:ring-4 focus:ring-forest-100 uppercase bg-white"
          />
          <button onClick={verifyCode} disabled={searching || !code.trim()}
            className="flex items-center gap-2 px-5 py-3 bg-forest-700 hover:bg-forest-800 text-white font-semibold rounded-xl disabled:opacity-60 transition-colors text-sm">
            <Search className="w-4 h-4" />{t('security.verify')}
          </button>
        </div>

        {notFound && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
            {t('security.invalidCode')}
          </div>
        )}

        {visitor && (
          <div className="mt-5 bg-forest-50 border border-forest-200 rounded-xl p-5">
            <p className="text-xs font-semibold text-forest-500 uppercase tracking-wide mb-3">{t('security.visitorDetails')}</p>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-xs text-forest-500">Name</span>
                <span className="font-semibold text-forest-800 text-sm">{visitor.visitor_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-forest-500">Plot</span>
                <span className="font-semibold text-forest-800 text-sm">{visitor.plots?.plot_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-forest-500">Purpose</span>
                <span className="font-semibold text-forest-800 text-sm">{visitor.purpose}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-forest-500">Expected Date</span>
                <span className="font-semibold text-forest-800 text-sm">{new Date(visitor.expected_date).toLocaleDateString('en-IN')}</span>
              </div>
              {visitor.vehicle_number && (
                <div className="flex justify-between">
                  <span className="text-xs text-forest-500">Vehicle</span>
                  <span className="font-semibold text-forest-800 text-sm">{visitor.vehicle_number}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-xs text-forest-500">Status</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[visitor.status]}`}>
                  {t(`visitors.${visitor.status}`)}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              {(visitor.status === 'pre_approved') && (
                <button onClick={logEntry} disabled={logging}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold rounded-xl disabled:opacity-60 transition-colors text-sm">
                  <LogIn className="w-4 h-4" />{t('security.logEntry')}
                </button>
              )}
              {visitor.status === 'entered' && (
                <button onClick={logExit} disabled={logging}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl disabled:opacity-60 transition-colors text-sm">
                  <LogOut className="w-4 h-4" />{t('security.logExit')}
                </button>
              )}
              {visitor.status === 'exited' && (
                <p className="flex-1 text-center text-sm text-forest-500 py-2">Visitor has already exited</p>
              )}
              <button onClick={reset}
                className="px-4 py-2.5 border border-forest-200 text-forest-600 rounded-xl hover:bg-forest-50 transition-colors text-sm font-medium">
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recent activity */}
      <div className="bg-white border border-forest-100 rounded-2xl p-6">
        <p className="text-xs font-semibold text-forest-500 uppercase tracking-wide mb-4">{t('security.recentLog')}</p>
        {recentActivity.length === 0 ? (
          <div className="text-center py-8 text-forest-400">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentActivity.map(v => (
              <div key={v.id} className="flex items-center justify-between py-2 border-b border-forest-50 last:border-0">
                <div>
                  <p className="font-semibold text-forest-800 text-sm">{v.visitor_name}</p>
                  <p className="text-xs text-forest-400">{v.plots?.plot_number} · {v.purpose}</p>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[v.status]}`}>
                    {t(`visitors.${v.status}`)}
                  </span>
                  {v.entry_time && (
                    <p className="text-xs text-forest-400 mt-0.5">{new Date(v.entry_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
