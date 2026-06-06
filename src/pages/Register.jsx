import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import notify from '../lib/notify'
import { Leaf, Eye, EyeOff, UserPlus, CheckCircle, AlertCircle, Info } from 'lucide-react'

// ── Validation rules ─────────────────────────────────
const RULES = {
  fullName: v => {
    if (!v.trim()) return 'Full name is required'
    if (v.trim().length < 3) return 'Name must be at least 3 characters'
    if (/\d/.test(v)) return 'Name should not contain numbers'
    return ''
  },
  email: v => {
    if (!v.trim()) return 'Email address is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address (e.g. name@gmail.com)'
    return ''
  },
  phone: v => {
    if (!v.trim()) return 'Phone number is required'
    const digits = v.replace(/\D/g, '')
    if (digits.length !== 10) return 'Enter a valid 10-digit Indian mobile number'
    if (!/^[6-9]/.test(digits)) return 'Mobile number must start with 6, 7, 8, or 9'
    return ''
  },
  password: v => {
    if (!v) return 'Password is required'
    if (v.length < 8) return 'Password must be at least 8 characters'
    if (!/[A-Z]/.test(v)) return 'Add at least one uppercase letter (A–Z)'
    if (!/[0-9]/.test(v)) return 'Add at least one number (0–9)'
    return ''
  },
  confirmPassword: (v, pw) => {
    if (!v) return 'Please confirm your password'
    if (v !== pw) return 'Passwords do not match'
    return ''
  },
}

function passwordStrength(pw) {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { level: 1, label: 'Weak', color: 'bg-red-500' }
  if (score === 2) return { level: 2, label: 'Fair', color: 'bg-orange-400' }
  if (score === 3) return { level: 3, label: 'Good', color: 'bg-yellow-400' }
  return { level: 4, label: 'Strong', color: 'bg-forest-500' }
}

// ── Reusable Field ────────────────────────────────────
function Field({ label, error, touched, valid, required, children, hint }) {
  return (
    <div>
      <label className="flex items-center gap-1 text-sm font-semibold text-forest-800 mb-1.5">
        {label}
        {required && <span className="text-red-500 text-xs">*</span>}
      </label>
      {children}
      {touched && error && (
        <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-600 font-medium animate-fade-up">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
        </p>
      )}
      {touched && !error && valid && (
        <p className="flex items-center gap-1.5 mt-1.5 text-xs text-forest-600 font-medium animate-fade-up">
          <CheckCircle className="w-3.5 h-3.5 shrink-0" />Looks good!
        </p>
      )}
      {hint && !touched && (
        <p className="flex items-center gap-1.5 mt-1.5 text-xs text-forest-400">
          <Info className="w-3 h-3 shrink-0" />{hint}
        </p>
      )}
    </div>
  )
}

function inputClass(touched, error) {
  const base = 'w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none transition-all duration-200 bg-white font-medium'
  if (!touched) return `${base} border-gray-200 focus:border-forest-400 focus:ring-4 focus:ring-forest-100`
  if (error) return `${base} border-red-400 bg-red-50/30 focus:border-red-400 focus:ring-4 focus:ring-red-100`
  return `${base} border-forest-400 bg-forest-50/30 focus:border-forest-500 focus:ring-4 focus:ring-forest-100`
}

export default function Register() {
  const { t } = useTranslation()
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [plots, setPlots] = useState([])
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', plotId: '', password: '', confirmPassword: '' })
  const [touched, setTouched] = useState({})
  const [showPw, setShowPw] = useState(false)
  const [showCPw, setShowCPw] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('plots').select('id, plot_number, status').order('plot_number').then(({ data }) => setPlots(data ?? []))
  }, [])

  const errors = {
    fullName: RULES.fullName(form.fullName),
    email: RULES.email(form.email),
    phone: RULES.phone(form.phone),
    password: RULES.password(form.password),
    confirmPassword: RULES.confirmPassword(form.confirmPassword, form.password),
  }

  const isFormValid = Object.values(errors).every(e => e === '')
  const strength = form.password ? passwordStrength(form.password) : null

  function touch(field) { setTouched(prev => ({ ...prev, [field]: true })) }
  function touchAll() { setTouched({ fullName: true, email: true, phone: true, password: true, confirmPassword: true }) }

  async function handleSubmit(e) {
    e.preventDefault()
    touchAll()
    if (!isFormValid) {
      notify.warning('Fix Errors First', 'Please correct the highlighted fields before submitting.')
      return
    }
    setLoading(true)
    try {
      await signUp({ email: form.email, password: form.password, fullName: form.fullName, phone: form.phone, plotId: form.plotId || null })
      notify.success('Registration Submitted!', 'The Secretary will review and approve your account shortly. You will be notified by email.', { duration: 6000 })
      navigate('/login')
    } catch (err) {
      const msg = err.message ?? ''
      if (msg.includes('already registered')) notify.warning('Email Already Registered', 'This email is already in use. Try logging in instead.')
      else notify.error('Registration Failed', msg || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 relative"
      style={{
        backgroundImage: `linear-gradient(135deg,rgba(5,46,22,0.93),rgba(14,75,35,0.88)),url('https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1920&q=80')`,
        backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed',
      }}>
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="relative px-8 pt-8 pb-6 text-white overflow-hidden"
            style={{backgroundImage:`linear-gradient(135deg,rgba(5,46,22,0.95),rgba(21,128,61,0.9)),url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=70')`,backgroundSize:'cover',backgroundPosition:'center'}}>
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-gold-300 to-gold-600 rounded-2xl flex items-center justify-center shadow-lg shadow-gold-500/30">
                <Leaf className="w-7 h-7 text-forest-950" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold">{t('auth.register')}</h1>
                <p className="text-white/70 text-xs mt-0.5 tracking-wide">Aranya Hills Colony Welfare Association</p>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/5 rounded-full" />
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5" noValidate>

            {/* Full Name */}
            <Field label="Full Name" error={errors.fullName} touched={touched.fullName} valid required hint="As per your ID proof">
              <input type="text" value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                onBlur={() => touch('fullName')}
                className={inputClass(touched.fullName, errors.fullName)}
                placeholder="e.g. Ravi Kumar" />
            </Field>

            {/* Phone + Plot side by side */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone Number" error={errors.phone} touched={touched.phone} valid required hint="10-digit mobile">
                <input type="tel" value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  onBlur={() => touch('phone')}
                  className={inputClass(touched.phone, errors.phone)}
                  placeholder="98XXXXXXXX" maxLength={10} />
              </Field>
              <div>
                <label className="flex items-center gap-1 text-sm font-semibold text-forest-800 mb-1.5">
                  Plot Number <span className="text-forest-400 text-xs font-normal">(optional)</span>
                </label>
                <select value={form.plotId} onChange={e => setForm({ ...form, plotId: e.target.value })}
                  className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-forest-400 focus:ring-4 focus:ring-forest-100 bg-white font-medium transition-all">
                  <option value="">Select plot</option>
                  {plots.map(p => <option key={p.id} value={p.id}>{p.plot_number}</option>)}
                </select>
              </div>
            </div>

            {/* Email */}
            <Field label="Email Address" error={errors.email} touched={touched.email} valid required hint="You'll use this to login">
              <input type="email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                onBlur={() => touch('email')}
                className={inputClass(touched.email, errors.email)}
                placeholder="yourname@gmail.com" />
            </Field>

            {/* Password */}
            <Field label="Password" error={errors.password} touched={touched.password} valid required>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  onBlur={() => touch('password')}
                  className={inputClass(touched.password, errors.password) + ' pr-12'}
                  placeholder="Min. 8 characters" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-forest-600 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Strength meter */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        i <= (strength?.level ?? 0) ? strength?.color : 'bg-gray-200'
                      }`} />
                    ))}
                  </div>
                  <p className={`text-xs font-semibold ${
                    strength?.level === 4 ? 'text-forest-600' :
                    strength?.level === 3 ? 'text-yellow-600' :
                    strength?.level === 2 ? 'text-orange-500' : 'text-red-500'
                  }`}>Password strength: {strength?.label}</p>
                </div>
              )}
            </Field>

            {/* Confirm Password */}
            <Field label="Confirm Password" error={errors.confirmPassword} touched={touched.confirmPassword} valid required>
              <div className="relative">
                <input type={showCPw ? 'text' : 'password'} value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  onBlur={() => touch('confirmPassword')}
                  className={inputClass(touched.confirmPassword, errors.confirmPassword) + ' pr-12'}
                  placeholder="Re-enter your password" />
                <button type="button" onClick={() => setShowCPw(!showCPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-forest-600 transition-colors">
                  {showCPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>

            {/* Info box */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                After registration, the <strong>Secretary will review and approve</strong> your account. You will receive an email notification once approved.
              </p>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                isFormValid && !loading
                  ? 'bg-gradient-to-r from-forest-600 to-forest-700 hover:from-forest-700 hover:to-forest-800 text-white shadow-lg shadow-forest-500/25 hover:shadow-forest-500/40 hover:-translate-y-0.5'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}>
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                : <><UserPlus className="w-4 h-4" />{t('auth.registerBtn')}</>
              }
            </button>

            <p className="text-center text-sm text-gray-500">
              {t('auth.hasAccount')}{' '}
              <Link to="/login" className="text-forest-700 font-bold hover:text-forest-900 transition-colors">{t('auth.loginBtn')}</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
