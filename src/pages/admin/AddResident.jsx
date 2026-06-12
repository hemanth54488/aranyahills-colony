import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import notify from '../../lib/notify'
import {
  UserPlus, ArrowLeft, Eye, EyeOff, CheckCircle,
  AlertCircle, Copy, Check
} from 'lucide-react'

const RULES = {
  full_name: v => {
    if (!v?.trim()) return 'Full name is required'
    if (v.trim().length < 3) return 'Name must be at least 3 characters'
    if (/\d/.test(v)) return 'Name should not contain numbers'
    return ''
  },
  email: v => {
    if (!v?.trim()) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address'
    return ''
  },
  phone: v => {
    if (!v?.trim()) return ''
    const d = v.replace(/\D/g, '')
    if (d.length !== 10) return 'Enter a valid 10-digit number'
    if (!/^[6-9]/.test(d)) return 'Number must start with 6, 7, 8 or 9'
    return ''
  },
  password: v => {
    if (!v) return 'Password is required'
    if (v.length < 8) return 'Minimum 8 characters'
    if (!/[A-Z]/.test(v)) return 'At least one uppercase letter required'
    if (!/[0-9]/.test(v)) return 'At least one number required'
    return ''
  },
}

function inputClass(touched, error) {
  const base = 'w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none transition-all bg-white font-medium'
  if (!touched) return `${base} border-gray-200 focus:border-forest-400 focus:ring-4 focus:ring-forest-100`
  if (error)    return `${base} border-red-400 bg-red-50/30 focus:border-red-400 focus:ring-4 focus:ring-red-100`
  return              `${base} border-forest-400 bg-forest-50/30 focus:border-forest-500 focus:ring-4 focus:ring-forest-100`
}

function FieldMsg({ touched, error }) {
  if (!touched || !error) return null
  return (
    <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-600 font-medium animate-fade-up">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
    </p>
  )
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button type="button" onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="p-1.5 rounded-lg text-forest-400 hover:text-forest-600 hover:bg-forest-50 transition-colors">
      {copied ? <Check className="w-4 h-4 text-forest-600" /> : <Copy className="w-4 h-4" />}
    </button>
  )
}

export default function AddResident() {
  const navigate = useNavigate()
  const [plots, setPlots] = useState([])
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', plot_id: '', password: '', role: 'resident' })
  const [touched, setTouched] = useState({})
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null) // { name, email, password, plot }

  useEffect(() => {
    supabase.from('plots').select('id, plot_number, status').order('plot_number')
      .then(({ data }) => setPlots(data ?? []))
  }, [])

  const errors = {
    full_name: RULES.full_name(form.full_name),
    email:     RULES.email(form.email),
    phone:     RULES.phone(form.phone),
    password:  RULES.password(form.password),
  }
  const isValid = !Object.values(errors).some(Boolean) && form.plot_id

  function touchAll() {
    setTouched({ full_name: true, email: true, phone: true, password: true, plot_id: true })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    touchAll()
    if (!isValid) return
    setLoading(true)

    // Save admin session before signUp potentially changes it
    const { data: { session: adminSession } } = await supabase.auth.getSession()

    try {
      // Create the new user account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: { data: { full_name: form.full_name.trim(), phone: form.phone.trim() } },
      })

      if (signUpError) throw signUpError
      if (!signUpData.user) throw new Error('User creation failed — check if email already exists')

      const newUserId = signUpData.user.id

      // Update the auto-created profile with all details + auto-approve
      const { error: profileError } = await supabase.from('profiles').update({
        full_name: form.full_name.trim(),
        phone:     form.phone.trim() || null,
        plot_id:   form.plot_id || null,
        role:      form.role,
        status:    'approved',
      }).eq('id', newUserId)

      if (profileError) throw profileError

      // Restore admin session (signUp may have switched the session)
      if (adminSession) {
        await supabase.auth.setSession({
          access_token:  adminSession.access_token,
          refresh_token: adminSession.refresh_token,
        })
      }

      const plot = plots.find(p => p.id === form.plot_id)
      setSuccess({
        name:     form.full_name.trim(),
        email:    form.email.trim(),
        password: form.password,
        plot:     plot?.plot_number ?? '—',
      })
      notify.success('Resident added!', `${form.full_name.trim()} can now log in immediately.`)

    } catch (err) {
      // Always restore admin session on error too
      if (adminSession) {
        await supabase.auth.setSession({
          access_token:  adminSession.access_token,
          refresh_token: adminSession.refresh_token,
        })
      }
      notify.error('Failed to add resident', err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Success screen ────────────────────────────────────
  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-3xl border border-forest-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-forest-600 to-forest-800 px-8 py-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-display text-2xl font-bold text-white">Resident Added!</h2>
            <p className="text-forest-200 text-sm mt-1">{success.name} can log in immediately</p>
          </div>

          <div className="px-8 py-6 space-y-4">
            <p className="text-forest-600 text-sm font-medium text-center">Share these login details with the resident:</p>

            {[
              { label: 'Name',     value: success.name },
              { label: 'Plot',     value: success.plot },
              { label: 'Email',    value: success.email },
              { label: 'Password', value: success.password },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between bg-forest-50 rounded-xl px-4 py-3 border border-forest-100">
                <div>
                  <p className="text-xs text-forest-500 uppercase tracking-wide font-semibold">{label}</p>
                  <p className={`font-semibold text-forest-800 mt-0.5 ${label === 'Password' ? 'font-mono tracking-wide' : ''}`}>{value}</p>
                </div>
                <CopyBtn text={value} />
              </div>
            ))}

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-700 text-xs">
              ⚠️ Share these credentials securely. Resident should change their password after first login.
            </div>
          </div>

          <div className="px-8 pb-8 flex gap-3">
            <button onClick={() => { setSuccess(null); setForm({ full_name: '', email: '', phone: '', plot_id: '', password: '', role: 'resident' }); setTouched({}) }}
              className="flex-1 py-3 border-2 border-forest-200 rounded-xl text-sm font-bold text-forest-700 hover:bg-forest-50 transition-all">
              Add Another
            </button>
            <Link to="/admin" className="flex-1 py-3 text-center bg-gradient-to-r from-forest-600 to-forest-700 text-white rounded-xl text-sm font-bold hover:from-forest-700 hover:to-forest-800 transition-all">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Form ─────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      <div className="flex items-center gap-3 mb-8">
        <Link to="/admin" className="p-2 rounded-xl text-forest-500 hover:bg-forest-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-forest-800">Add Resident</h1>
          <p className="text-forest-500 text-sm mt-0.5">Create a resident account and link to their plot. Account is approved immediately.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-forest-100 shadow-sm">
        <form onSubmit={handleSubmit} noValidate className="px-7 py-6 space-y-5">

          {/* Full Name */}
          <div>
            <label className="flex items-center gap-1 text-sm font-semibold text-forest-800 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              onBlur={() => setTouched(p => ({ ...p, full_name: true }))}
              className={inputClass(touched.full_name, errors.full_name)}
              placeholder="e.g. Kondal Reddy D" />
            <FieldMsg touched={touched.full_name} error={errors.full_name} />
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center gap-1 text-sm font-semibold text-forest-800 mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input type="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              onBlur={() => setTouched(p => ({ ...p, email: true }))}
              className={inputClass(touched.email, errors.email)}
              placeholder="resident@gmail.com" />
            <FieldMsg touched={touched.email} error={errors.email} />
          </div>

          {/* Phone */}
          <div>
            <label className="flex items-center gap-1 text-sm font-semibold text-forest-800 mb-1.5">
              Phone Number
              <span className="text-forest-400 text-xs font-normal ml-1">(optional)</span>
            </label>
            <input type="tel" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g,'').slice(0,10) }))}
              onBlur={() => setTouched(p => ({ ...p, phone: true }))}
              className={inputClass(touched.phone, errors.phone)}
              placeholder="10-digit mobile number" maxLength={10} />
            <FieldMsg touched={touched.phone} error={errors.phone} />
          </div>

          {/* Plot + Role */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1 text-sm font-semibold text-forest-800 mb-1.5">
                Plot Number <span className="text-red-500">*</span>
              </label>
              <select value={form.plot_id}
                onChange={e => setForm(f => ({ ...f, plot_id: e.target.value }))}
                onBlur={() => setTouched(p => ({ ...p, plot_id: true }))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-forest-400 focus:ring-4 focus:ring-forest-100 bg-white font-medium transition-all">
                <option value="">Select plot...</option>
                {plots.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.plot_number} {p.status === 'occupied' ? '(occupied)' : ''}
                  </option>
                ))}
              </select>
              {touched.plot_id && !form.plot_id && (
                <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-600 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />Plot is required
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-forest-800 mb-1.5 block">Role</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-forest-400 focus:ring-4 focus:ring-forest-100 bg-white font-medium transition-all">
                <option value="resident">Resident</option>
                <option value="committee">Committee</option>
                <option value="security">Security</option>
              </select>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="flex items-center gap-1 text-sm font-semibold text-forest-800 mb-1.5">
              Login Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                onBlur={() => setTouched(p => ({ ...p, password: true }))}
                className={inputClass(touched.password, errors.password) + ' pr-12'}
                placeholder="Min 8 chars, 1 uppercase, 1 number" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-forest-600 transition-colors">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <FieldMsg touched={touched.password} error={errors.password} />
            <p className="text-xs text-forest-400 mt-1">
              You'll share this with the resident. They can change it later.
            </p>
          </div>

          {/* Preview */}
          {form.full_name && form.plot_id && (
            <div className="flex items-center gap-3 bg-forest-50 border border-forest-100 rounded-xl p-3">
              <div className="w-10 h-10 bg-gradient-to-br from-forest-500 to-forest-700 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">{form.full_name[0]?.toUpperCase()}</span>
              </div>
              <div>
                <p className="font-semibold text-forest-900 text-sm">{form.full_name}</p>
                <p className="text-forest-500 text-xs">
                  {plots.find(p => p.id === form.plot_id)?.plot_number} · {form.role} · Auto-approved
                </p>
              </div>
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
              isValid && !loading
                ? 'bg-gradient-to-r from-forest-600 to-forest-700 hover:from-forest-700 hover:to-forest-800 text-white shadow-lg shadow-forest-500/25 hover:-translate-y-0.5'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}>
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account...</>
              : <><UserPlus className="w-4 h-4" />Add Resident & Approve</>
            }
          </button>
        </form>
      </div>
    </div>
  )
}
