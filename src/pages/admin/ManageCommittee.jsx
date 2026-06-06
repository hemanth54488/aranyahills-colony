import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import notify from '../../lib/notify'
import { Users, Plus, Trash2, ArrowLeft, CheckCircle, AlertCircle, X, Archive, UserPlus } from 'lucide-react'
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

const ROLE_LABELS = {
  president: 'President',
  vice_president: 'Vice President',
  general_secretary: 'General Secretary',
  joint_secretary: 'Joint Secretary',
  treasurer: 'Treasurer',
  executive_member: 'Executive Member',
}

const CURRENT_YEAR = new Date().getFullYear()

// ── Validation rules ─────────────────────────────────
const RULES = {
  full_name: v => {
    if (!v.trim()) return 'Full name is required'
    if (v.trim().length < 3) return 'Name must be at least 3 characters'
    if (/\d/.test(v)) return 'Name should not contain numbers'
    return ''
  },
  year: v => {
    const n = parseInt(v)
    if (!v) return 'Year is required'
    if (isNaN(n)) return 'Enter a valid year'
    if (n < 2000 || n > 2100) return 'Year must be between 2000 and 2100'
    return ''
  },
  phone: v => {
    if (!v.trim()) return ''
    const digits = v.replace(/\D/g, '')
    if (digits.length !== 10) return 'Enter a valid 10-digit mobile number'
    if (!/^[6-9]/.test(digits)) return 'Mobile number must start with 6, 7, 8, or 9'
    return ''
  },
  email: v => {
    if (!v.trim()) return ''
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email (e.g. name@gmail.com)'
    return ''
  },
  photo_url: v => {
    if (!v.trim()) return ''
    if (!v.startsWith('http')) return 'Photo URL must start with http:// or https://'
    return ''
  },
}

function inputClass(touched, error, optional = false) {
  const base = 'w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none transition-all duration-200 bg-white font-medium'
  if (!touched) return `${base} border-gray-200 focus:border-forest-400 focus:ring-4 focus:ring-forest-100`
  if (error)    return `${base} border-red-400 bg-red-50/30 focus:border-red-400 focus:ring-4 focus:ring-red-100`
  return              `${base} border-forest-400 bg-forest-50/30 focus:border-forest-500 focus:ring-4 focus:ring-forest-100`
}

function FieldMsg({ touched, error, valid, validMsg }) {
  if (!touched) return null
  if (error) return (
    <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-600 font-medium animate-fade-up">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
    </p>
  )
  if (valid) return (
    <p className="flex items-center gap-1.5 mt-1.5 text-xs text-forest-600 font-medium animate-fade-up">
      <CheckCircle className="w-3.5 h-3.5 shrink-0" />{validMsg ?? 'Looks good!'}
    </p>
  )
  return null
}

// ── Confirm Dialog ────────────────────────────────────
function ConfirmDialog({ message, subtext, confirmLabel, confirmClass, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-scale-in overflow-hidden">
        <div className="p-6">
          <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="font-display text-lg font-bold text-gray-900 mb-1">{message}</h3>
          {subtext && <p className="text-sm text-gray-500">{subtext}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onCancel}
            className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors ${confirmClass}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Add Member Modal ──────────────────────────────────
function AddMemberModal({ onClose, onAdd }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    full_name: '', role: 'president',
    year: CURRENT_YEAR, phone: '', email: '', photo_url: ''
  })
  const [touched, setTouched] = useState({})
  const [loading, setLoading] = useState(false)

  const errors = {
    full_name: RULES.full_name(form.full_name),
    year: RULES.year(String(form.year)),
    phone: RULES.phone(form.phone),
    email: RULES.email(form.email),
    photo_url: RULES.photo_url(form.photo_url),
  }

  const isValid = !errors.full_name && !errors.year && !errors.phone && !errors.email && !errors.photo_url

  function touch(field) { setTouched(p => ({ ...p, [field]: true })) }
  function touchAll() { setTouched({ full_name: true, year: true, phone: true, email: true, photo_url: true }) }

  async function handleSubmit(e) {
    e.preventDefault()
    touchAll()
    if (!isValid) {
      notify.warning('Fix Errors First', 'Please correct the highlighted fields before saving.')
      return
    }
    setLoading(true)
    const { error } = await supabase.from('committee_members').insert({ ...form, year: parseInt(form.year), is_active: true })
    setLoading(false)
    if (error) { notify.error('Failed to Add Member', error.message); return }
    notify.success('Member Added!', 'Committee member has been added successfully.')
    onAdd()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl my-4 overflow-hidden">

        {/* Header */}
        <div className="relative px-7 pt-7 pb-5 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-forest-500 to-forest-700 rounded-xl flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-gray-900">{t('admin.addMember')}</h2>
              <p className="text-xs text-gray-400 mt-0.5">All fields marked * are required</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="px-7 py-6 space-y-4">

          {/* Full Name */}
          <div>
            <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              onBlur={() => touch('full_name')}
              className={inputClass(touched.full_name, errors.full_name)}
              placeholder="e.g. Ravi Kumar" />
            <FieldMsg touched={touched.full_name} error={errors.full_name} valid={!errors.full_name} />
          </div>

          {/* Role + Year side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-1.5">
                Role <span className="text-red-500">*</span>
              </label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-forest-400 focus:ring-4 focus:ring-forest-100 bg-white font-medium transition-all">
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-1.5">
                Year <span className="text-red-500">*</span>
              </label>
              <input type="number" value={form.year}
                onChange={e => setForm({ ...form, year: e.target.value })}
                onBlur={() => touch('year')}
                className={inputClass(touched.year, errors.year)}
                placeholder={String(CURRENT_YEAR)} min="2000" max="2100" />
              <FieldMsg touched={touched.year} error={errors.year} valid={!errors.year} validMsg="Valid year" />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-1.5">
              Phone Number
              <span className="text-gray-400 text-xs font-normal ml-1">(optional)</span>
            </label>
            <input type="tel" value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              onBlur={() => touch('phone')}
              className={inputClass(touched.phone, errors.phone)}
              placeholder="10-digit mobile number" maxLength={10} />
            <FieldMsg touched={touched.phone} error={errors.phone} valid={form.phone && !errors.phone} validMsg="Valid phone number" />
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-1.5">
              Email Address
              <span className="text-gray-400 text-xs font-normal ml-1">(optional)</span>
            </label>
            <input type="text" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              onBlur={() => touch('email')}
              className={inputClass(touched.email, errors.email)}
              placeholder="name@gmail.com" />
            <FieldMsg touched={touched.email} error={errors.email} valid={form.email && !errors.email} validMsg="Valid email address" />
          </div>

          {/* Photo URL */}
          <div>
            <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-1.5">
              Photo URL
              <span className="text-gray-400 text-xs font-normal ml-1">(optional — from Cloudinary)</span>
            </label>
            <input type="text" value={form.photo_url}
              onChange={e => setForm({ ...form, photo_url: e.target.value })}
              onBlur={() => touch('photo_url')}
              className={inputClass(touched.photo_url, errors.photo_url)}
              placeholder="https://res.cloudinary.com/..." />
            <FieldMsg touched={touched.photo_url} error={errors.photo_url} valid={form.photo_url && !errors.photo_url} validMsg="Valid photo URL" />
          </div>

          {/* Role preview badge */}
          {form.full_name && (
            <div className="flex items-center gap-3 bg-forest-50 border border-forest-100 rounded-xl p-3">
              <div className="w-10 h-10 bg-forest-200 rounded-full flex items-center justify-center text-forest-700 font-bold font-display text-sm shrink-0">
                {form.full_name[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-forest-900">{form.full_name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[form.role]}`}>
                  {ROLE_LABELS[form.role]} — {form.year}
                </span>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className={`flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
                isValid && !loading
                  ? 'bg-gradient-to-r from-forest-600 to-forest-700 hover:from-forest-700 hover:to-forest-800 shadow-lg shadow-forest-500/25 hover:-translate-y-0.5'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}>
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
                : <><UserPlus className="w-4 h-4" />Add Member</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────
export default function ManageCommittee() {
  const { t } = useTranslation()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [tab, setTab] = useState('active')
  const [confirm, setConfirm] = useState(null)

  async function load() {
    const { data } = await supabase.from('committee_members').select('*').order('year', { ascending: false }).order('created_at')
    setMembers(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function askConfirm(cfg) { setConfirm(cfg) }

  async function archive(id) {
    askConfirm({
      message: 'Archive this member?',
      subtext: 'They will be moved to Past Committees and can be viewed under the "Past / Archived" tab.',
      confirmLabel: 'Yes, Archive',
      confirmClass: 'bg-earth-600 hover:bg-earth-700',
      onConfirm: async () => {
        setConfirm(null)
        await supabase.from('committee_members').update({ is_active: false }).eq('id', id)
        notify.info('Member Archived', 'Member moved to past committees successfully.')
        load()
      }
    })
  }

  async function deleteMember(id) {
    askConfirm({
      message: 'Permanently delete member?',
      subtext: 'This action cannot be undone. The member record will be removed completely.',
      confirmLabel: 'Yes, Delete',
      confirmClass: 'bg-red-500 hover:bg-red-600',
      onConfirm: async () => {
        setConfirm(null)
        await supabase.from('committee_members').delete().eq('id', id)
        notify.success('Member Deleted', 'Committee member has been permanently removed.')
        load()
      }
    })
  }

  const filtered = members.filter(m => tab === 'active' ? m.is_active : !m.is_active)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      <Link to="/admin" className="inline-flex items-center gap-2 text-forest-600 hover:text-forest-800 mb-6 text-sm font-semibold transition-colors">
        <ArrowLeft className="w-4 h-4" />Back to Dashboard
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-forest-900">{t('admin.manageCommittee')}</h1>
          <p className="text-gray-500 text-sm mt-1">Add, archive, or remove committee members</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-forest-600 to-forest-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:from-forest-700 hover:to-forest-800 shadow-lg shadow-forest-500/25 hover:-translate-y-0.5 transition-all duration-200">
          <Plus className="w-4 h-4" />{t('admin.addMember')}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {[['active','Current Committee'],['archived','Past / Archived']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === key ? 'bg-white text-forest-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {label}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === key ? 'bg-forest-100 text-forest-700' : 'bg-gray-200 text-gray-500'}`}>
              {members.filter(m => key === 'active' ? m.is_active : !m.is_active).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-white rounded-xl h-20 animate-pulse border border-forest-100" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-forest-200">
          <Users className="w-12 h-12 mx-auto mb-3 text-forest-200" />
          <p className="text-gray-500 font-medium">No members here yet.</p>
          <p className="text-gray-400 text-sm mt-1">Click "+ Add Member" to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(member => (
            <div key={member.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between gap-4 hover:border-forest-200 hover:shadow-sm transition-all">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-forest-100 to-forest-200 overflow-hidden shrink-0 flex items-center justify-center">
                  {member.photo_url
                    ? <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
                    : <span className="font-display font-bold text-forest-600 text-lg">{member.full_name?.[0]}</span>
                  }
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900">{member.full_name}</p>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${ROLE_COLORS[member.role]}`}>
                      {t(`committee.${member.role}`)}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">{member.year}</span>
                  </div>
                  {(member.phone || member.email) && (
                    <p className="text-sm text-gray-500 mt-0.5">{member.phone ?? member.email}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                {member.is_active && (
                  <button onClick={() => archive(member.id)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-earth-200 text-earth-700 rounded-lg hover:bg-earth-50 transition-colors font-semibold">
                    <Archive className="w-3.5 h-3.5" />Archive
                  </button>
                )}
                <button onClick={() => deleteMember(member.id)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete permanently">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddMemberModal onClose={() => setShowAdd(false)} onAdd={load} />}
      {confirm && <ConfirmDialog {...confirm} onCancel={() => setConfirm(null)} />}
    </div>
  )
}
