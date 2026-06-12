import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import notify from '../../lib/notify'
import {
  Users, ArrowLeft, Search, Trash2, CheckCircle, X,
  Clock, UserCheck, UserX, ChevronDown, Phone, Mail, Home
} from 'lucide-react'

const STATUS_STYLES = {
  approved: 'bg-forest-100 text-forest-700 border-forest-200',
  pending:  'bg-amber-100  text-amber-700  border-amber-200',
  rejected: 'bg-red-100    text-red-700    border-red-200',
}
const STATUS_ICONS = { approved: CheckCircle, pending: Clock, rejected: UserX }

const ROLE_STYLES = {
  admin:     'bg-gold-100 text-gold-700',
  committee: 'bg-forest-100 text-forest-700',
  resident:  'bg-gray-100 text-gray-600',
  security:  'bg-blue-100 text-blue-700',
}

export default function ManageResidents() {
  const [residents, setResidents] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterRole, setFilterRole]     = useState('all')
  const [confirm, setConfirm]     = useState(null) // { id, name }
  const [deleting, setDeleting]   = useState(false)
  const [updating, setUpdating]   = useState(null)

  function fetchResidents() {
    supabase
      .from('profiles')
      .select('*, plots(plot_number)')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setResidents(data ?? []); setLoading(false) })
  }
  useEffect(() => { fetchResidents() }, [])

  // ── Filters ───────────────────────────────────────────
  const filtered = residents.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q
      || r.full_name?.toLowerCase().includes(q)
      || r.email?.toLowerCase().includes(q)
      || r.phone?.includes(q)
      || r.plots?.plot_number?.toLowerCase().includes(q)
    const matchStatus = filterStatus === 'all' || r.status === filterStatus
    const matchRole   = filterRole   === 'all' || r.role   === filterRole
    return matchSearch && matchStatus && matchRole
  })

  // ── Status counts ─────────────────────────────────────
  const counts = {
    all:      residents.length,
    approved: residents.filter(r => r.status === 'approved').length,
    pending:  residents.filter(r => r.status === 'pending').length,
    rejected: residents.filter(r => r.status === 'rejected').length,
  }

  // ── Change status ─────────────────────────────────────
  async function changeStatus(id, status) {
    setUpdating(id)
    const { error } = await supabase.from('profiles').update({ status }).eq('id', id)
    setUpdating(null)
    if (error) { notify.error('Update failed', error.message); return }
    notify.success(status === 'approved' ? 'Resident approved' : 'Resident rejected')
    setResidents(r => r.map(x => x.id === id ? { ...x, status } : x))
  }

  // ── Change role ───────────────────────────────────────
  async function changeRole(id, role) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
    if (error) { notify.error('Update failed', error.message); return }
    notify.success('Role updated')
    setResidents(r => r.map(x => x.id === id ? { ...x, role } : x))
  }

  // ── Delete ────────────────────────────────────────────
  async function deleteResident() {
    if (!confirm) return
    setDeleting(true)
    // Deleting the profile cascades to family_members, vehicles, etc.
    // The auth.users record becomes orphaned (no site access) until
    // fully cleaned from Supabase Auth dashboard if needed.
    const { error } = await supabase.from('profiles').delete().eq('id', confirm.id)
    setDeleting(false)
    if (error) { notify.error('Delete failed', error.message); setConfirm(null); return }
    notify.success('Resident removed', `${confirm.name} has been deleted.`)
    setResidents(r => r.filter(x => x.id !== confirm.id))
    setConfirm(null)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link to="/admin" className="p-2 rounded-xl text-forest-500 hover:bg-forest-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold text-forest-800">Manage Residents</h1>
          <p className="text-forest-500 text-sm mt-0.5">All registered users — approved, pending, and rejected</p>
        </div>
        <Link to="/admin/add-resident"
          className="flex items-center gap-2 px-4 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold text-sm rounded-xl transition-colors">
          + Add Resident
        </Link>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 flex-wrap mb-5">
        {[
          { key: 'all',      label: `All (${counts.all})` },
          { key: 'approved', label: `Approved (${counts.approved})` },
          { key: 'pending',  label: `Pending (${counts.pending})` },
          { key: 'rejected', label: `Rejected (${counts.rejected})` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFilterStatus(key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              filterStatus === key
                ? 'bg-forest-700 text-white border-forest-700'
                : 'bg-white text-forest-600 border-forest-200 hover:bg-forest-50'
            }`}>
            {label}
          </button>
        ))}

        {/* Role filter */}
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className="ml-auto px-3 py-2 border border-forest-200 rounded-xl text-xs font-semibold text-forest-600 focus:outline-none focus:border-forest-400 bg-white">
          <option value="all">All Roles</option>
          <option value="resident">Resident</option>
          <option value="committee">Committee</option>
          <option value="admin">Admin</option>
          <option value="security">Security</option>
        </select>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, phone or plot number..."
          className="w-full pl-10 pr-4 py-2.5 border border-forest-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-400 bg-white" />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">{[...Array(6)].map((_,i) => <div key={i} className="h-16 bg-forest-50 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-forest-100 text-forest-400">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No residents found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-forest-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-forest-50 border-b border-forest-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-forest-600 uppercase tracking-wide">Resident</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-forest-600 uppercase tracking-wide hidden md:table-cell">Plot</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-forest-600 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-forest-600 uppercase tracking-wide hidden lg:table-cell">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-forest-600 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest-50">
              {filtered.map(r => {
                const Icon = STATUS_ICONS[r.status] ?? Clock
                const isUpdating = updating === r.id
                return (
                  <tr key={r.id} className="hover:bg-forest-50/50 transition-colors">

                    {/* Resident info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-forest-500 to-forest-700 flex items-center justify-center shrink-0 text-white font-bold text-sm">
                          {r.full_name?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-forest-800 truncate">{r.full_name}</p>
                          <p className="text-xs text-forest-400 truncate">{r.email}</p>
                          {r.phone && <p className="text-xs text-forest-400">{r.phone}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Plot */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      {r.plots?.plot_number
                        ? <span className="flex items-center gap-1 text-forest-700 font-medium text-sm"><Home className="w-3.5 h-3.5 text-forest-400" />{r.plots.plot_number}</span>
                        : <span className="text-forest-300 text-xs">No plot</span>
                      }
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[r.status]}`}>
                        <Icon className="w-3 h-3" />
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </span>
                    </td>

                    {/* Role (editable) */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <select
                        value={r.role}
                        onChange={e => changeRole(r.id, e.target.value)}
                        className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-forest-300 cursor-pointer ${ROLE_STYLES[r.role]}`}>
                        <option value="resident">Resident</option>
                        <option value="committee">Committee</option>
                        <option value="admin">Admin</option>
                        <option value="security">Security</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {r.status === 'pending' && (
                          <>
                            <button onClick={() => changeStatus(r.id, 'approved')} disabled={isUpdating}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50">
                              <CheckCircle className="w-3.5 h-3.5" />Approve
                            </button>
                            <button onClick={() => changeStatus(r.id, 'rejected')} disabled={isUpdating}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg border border-red-200 transition-colors disabled:opacity-50">
                              <X className="w-3.5 h-3.5" />Reject
                            </button>
                          </>
                        )}
                        {r.status === 'approved' && (
                          <button onClick={() => changeStatus(r.id, 'rejected')} disabled={isUpdating}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold rounded-lg border border-amber-200 transition-colors disabled:opacity-50">
                            <UserX className="w-3.5 h-3.5" />Suspend
                          </button>
                        )}
                        {r.status === 'rejected' && (
                          <button onClick={() => changeStatus(r.id, 'approved')} disabled={isUpdating}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-forest-50 hover:bg-forest-100 text-forest-700 text-xs font-semibold rounded-lg border border-forest-200 transition-colors disabled:opacity-50">
                            <UserCheck className="w-3.5 h-3.5" />Re-approve
                          </button>
                        )}
                        <button onClick={() => setConfirm({ id: r.id, name: r.full_name })}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete permanently">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-forest-50 text-xs text-forest-400">
            Showing {filtered.length} of {residents.length} users
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-display text-lg font-bold text-gray-900 mb-1">Delete Resident?</h3>
              <p className="text-gray-500 text-sm">
                <span className="font-semibold text-gray-700">{confirm.name}</span> will be permanently removed from the website. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setConfirm(null)}
                className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={deleteResident} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 transition-colors">
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
