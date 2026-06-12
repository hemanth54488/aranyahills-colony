import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ClipboardList, ArrowLeft, Search } from 'lucide-react'

const ACTION_COLORS = {
  APPROVE: 'bg-forest-100 text-forest-700',
  REJECT: 'bg-red-100 text-red-700',
  CREATE: 'bg-blue-100 text-blue-700',
  UPDATE: 'bg-amber-100 text-amber-700',
  DELETE: 'bg-red-100 text-red-700',
  VERIFY: 'bg-purple-100 text-purple-700',
}

function getActionColor(action) {
  for (const [key, cls] of Object.entries(ACTION_COLORS)) {
    if (action.includes(key)) return cls
  }
  return 'bg-gray-100 text-gray-600'
}

export default function AuditLogs() {
  const { t } = useTranslation()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 30

  useEffect(() => {
    supabase.from('audit_logs')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
      .then(({ data }) => { setLogs(prev => page === 0 ? (data ?? []) : [...prev, ...(data ?? [])]); setLoading(false) })
  }, [page])

  const filtered = logs.filter(l =>
    !search || l.action.toLowerCase().includes(search.toLowerCase()) || l.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) || l.entity_type?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/admin" className="p-2 rounded-xl text-forest-500 hover:bg-forest-50 transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="font-display text-2xl font-bold text-forest-800">{t('admin.auditLogs')}</h1>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by action, user, or entity..."
          className="w-full pl-10 pr-4 py-2.5 border border-forest-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-400 bg-white" />
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(10)].map((_,i) => <div key={i} className="h-12 bg-forest-50 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14 text-forest-400">
          <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No audit logs found</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-forest-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-forest-50 border-b border-forest-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-forest-600 uppercase tracking-wide">Time</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-forest-600 uppercase tracking-wide">Actor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-forest-600 uppercase tracking-wide">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-forest-600 uppercase tracking-wide">Entity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest-50">
                {filtered.map(log => (
                  <tr key={log.id} className="hover:bg-forest-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-forest-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleDateString('en-IN')} {new Date(log.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-forest-700">{log.profiles?.full_name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getActionColor(log.action)}`}>{log.action}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-forest-500">
                      {log.entity_type ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length >= PAGE_SIZE && (
            <button onClick={() => setPage(p => p + 1)}
              className="mt-4 w-full py-2.5 border border-forest-200 text-forest-600 rounded-xl hover:bg-forest-50 transition-colors text-sm font-medium">
              Load More
            </button>
          )}
        </>
      )}
    </div>
  )
}
