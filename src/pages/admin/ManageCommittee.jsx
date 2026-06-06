import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { Users, Plus, Trash2, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const ROLES = ['president','vice_president','general_secretary','joint_secretary','treasurer','executive_member']

const ROLE_COLORS = {
  president: 'bg-gold-400 text-forest-900',
  vice_president: 'bg-forest-600 text-white',
  general_secretary: 'bg-forest-700 text-white',
  joint_secretary: 'bg-earth-500 text-white',
  treasurer: 'bg-forest-500 text-white',
  executive_member: 'bg-forest-300 text-forest-800',
}

function AddMemberModal({ onClose, onAdd }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ full_name: '', role: 'president', year: new Date().getFullYear(), phone: '', email: '', photo_url: '' })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('committee_members').insert({ ...form, is_active: true })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Committee member added!')
    onAdd()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl my-4">
        <div className="p-6 border-b border-forest-100">
          <h2 className="font-display text-xl font-bold text-forest-800">{t('admin.addMember')}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <input required placeholder="Full Name" value={form.full_name}
            onChange={e => setForm({ ...form, full_name: e.target.value })}
            className="w-full px-4 py-2.5 border border-forest-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
          />

          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
            className="w-full px-4 py-2.5 border border-forest-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-400 bg-white">
            {ROLES.map(r => (
              <option key={r} value={r}>{t(`committee.${r}`)}</option>
            ))}
          </select>

          <input type="number" required placeholder="Year" value={form.year}
            onChange={e => setForm({ ...form, year: parseInt(e.target.value) })}
            className="w-full px-4 py-2.5 border border-forest-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
          />
          <input placeholder="Phone" value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            className="w-full px-4 py-2.5 border border-forest-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
          />
          <input type="email" placeholder="Email" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-2.5 border border-forest-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
          />
          <input placeholder="Photo URL (from Cloudinary or upload later)" value={form.photo_url}
            onChange={e => setForm({ ...form, photo_url: e.target.value })}
            className="w-full px-4 py-2.5 border border-forest-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
          />

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-forest-200 rounded-xl text-sm font-medium text-forest-600 hover:bg-forest-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-forest-700 text-white rounded-xl text-sm font-medium hover:bg-forest-800 disabled:opacity-60">
              {loading ? 'Saving...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ManageCommittee() {
  const { t } = useTranslation()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [tab, setTab] = useState('active')

  async function load() {
    const { data } = await supabase
      .from('committee_members')
      .select('*')
      .order('year', { ascending: false })
      .order('created_at')
    setMembers(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function archive(id) {
    if (!window.confirm('Archive this member? They will be moved to past committees.')) return
    await supabase.from('committee_members').update({ is_active: false }).eq('id', id)
    toast.success('Member archived.')
    load()
  }

  async function deleteMember(id) {
    if (!window.confirm('Permanently delete this member?')) return
    await supabase.from('committee_members').delete().eq('id', id)
    toast.success('Member deleted.')
    load()
  }

  const filtered = members.filter(m => tab === 'active' ? m.is_active : !m.is_active)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      <Link to="/admin" className="inline-flex items-center gap-2 text-forest-600 hover:text-forest-800 mb-6 text-sm font-medium">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-bold text-forest-800">{t('admin.manageCommittee')}</h1>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-forest-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-forest-800">
          <Plus className="w-4 h-4" />
          {t('admin.addMember')}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['active', 'archived'].map(t_key => (
          <button key={t_key} onClick={() => setTab(t_key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === t_key ? 'bg-forest-700 text-white' : 'bg-white border border-forest-200 text-forest-600'
            }`}>
            {t_key === 'active' ? 'Current Committee' : 'Past / Archived'}
            <span className="ml-2 bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
              {members.filter(m => t_key === 'active' ? m.is_active : !m.is_active).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-20 animate-pulse border border-forest-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-forest-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No members in this category. Click "Add Member" to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(member => (
            <div key={member.id} className="bg-white rounded-xl border border-forest-100 p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-full bg-forest-100 overflow-hidden shrink-0 flex items-center justify-center">
                  {member.photo_url
                    ? <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
                    : <span className="font-display font-bold text-forest-500 text-lg">{member.full_name?.[0]}</span>
                  }
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-forest-800">{member.full_name}</p>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[member.role]}`}>
                      {t(`committee.${member.role}`)}
                    </span>
                    <span className="text-xs text-forest-400">{member.year}</span>
                  </div>
                  {(member.phone || member.email) && (
                    <p className="text-sm text-forest-500 mt-0.5">{member.phone ?? member.email}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                {member.is_active && (
                  <button onClick={() => archive(member.id)}
                    className="text-xs px-3 py-1.5 border border-earth-200 text-earth-600 rounded-lg hover:bg-earth-50 transition-colors font-medium">
                    Archive
                  </button>
                )}
                <button onClick={() => deleteMember(member.id)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddMemberModal onClose={() => setShowAdd(false)} onAdd={load} />}
    </div>
  )
}
