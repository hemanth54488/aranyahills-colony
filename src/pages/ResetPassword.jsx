import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import notify from '../lib/notify'
import { Leaf, Eye, EyeOff, CheckCircle, AlertCircle, Lock } from 'lucide-react'
import ColonyLogo from '../components/ColonyLogo'

function strengthLevel(pw) {
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']
const STRENGTH_COLORS = ['', 'bg-red-400', 'bg-amber-400', 'bg-blue-400', 'bg-forest-500']

function inputClass(touched, error) {
  const base = 'w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none transition-all bg-white font-medium'
  if (!touched) return `${base} border-gray-200 focus:border-forest-400 focus:ring-4 focus:ring-forest-100`
  if (error)    return `${base} border-red-400 bg-red-50/30 focus:border-red-400 focus:ring-4 focus:ring-red-100`
  return              `${base} border-forest-400 bg-forest-50/30 focus:border-forest-500 focus:ring-4 focus:ring-forest-100`
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [showCf, setShowCf]     = useState(false)
  const [touched, setTouched]   = useState({})
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)
  const [tokenReady, setTokenReady] = useState(false)

  // Supabase puts the recovery token in the URL hash
  // onAuthStateChange fires with event='PASSWORD_RECOVERY' when the link is followed
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setTokenReady(true)
    })
    // Also check current session in case the user landed here via the email link
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setTokenReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const pwErr = password.length > 0 && password.length < 8 ? 'At least 8 characters required' : ''
  const cfErr = confirm.length > 0 && confirm !== password ? 'Passwords do not match' : ''
  const isValid = password.length >= 8 && confirm === password && !pwErr && !cfErr
  const strength = strengthLevel(password)

  async function handleSubmit(e) {
    e.preventDefault()
    setTouched({ password: true, confirm: true })
    if (!isValid) return
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      notify.error('Password update failed', error.message)
      return
    }
    setDone(true)
    notify.success('Password set successfully!', 'You can now log in with your new password.')
    setTimeout(() => navigate('/'), 2500)
  }

  // ── Success ───────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mesh px-4">
        <div className="text-center animate-scale-in">
          <div className="w-20 h-20 bg-forest-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-forest-600" />
          </div>
          <h2 className="font-display text-2xl font-bold text-forest-900 mb-2">Password Set!</h2>
          <p className="text-forest-500 text-sm">Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  // ── No token yet ──────────────────────────────────────
  if (!tokenReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mesh px-4">
        <div className="text-center max-w-sm">
          <div className="mx-auto w-fit mb-4"><ColonyLogo size={56} /></div>
          <h2 className="font-display text-xl font-bold text-forest-900 mb-2">Checking your link…</h2>
          <p className="text-forest-500 text-sm">
            If you came from a "Set Password" email, please wait a moment.
            If this persists, the link may have expired — contact the admin.
          </p>
        </div>
      </div>
    )
  }

  // ── Set Password form ─────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh px-4 py-12">
      <div className="w-full max-w-md animate-fade-up">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <ColonyLogo size={48} />
          <div>
            <div className="font-display font-bold text-forest-900 text-lg">Aranya Hills Colony</div>
            <div className="text-forest-500 text-xs">Set your account password</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-forest-100 overflow-hidden">
          <div className="px-7 py-6 border-b border-forest-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-forest-100 rounded-xl flex items-center justify-center">
                <Lock className="w-5 h-5 text-forest-600" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-forest-900">Set Your Password</h1>
                <p className="text-forest-500 text-xs mt-0.5">Choose a secure password for your account</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="px-7 py-6 space-y-5">

            {/* New password */}
            <div>
              <label className="flex items-center gap-1 text-sm font-semibold text-forest-800 mb-1.5">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onBlur={() => setTouched(p => ({ ...p, password: true }))}
                  className={inputClass(touched.password, pwErr) + ' pr-12'}
                  placeholder="At least 8 characters"
                  autoFocus
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-forest-600 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength bar */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? STRENGTH_COLORS[strength] : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${strength <= 1 ? 'text-red-500' : strength === 2 ? 'text-amber-500' : strength === 3 ? 'text-blue-500' : 'text-forest-600'}`}>
                    {STRENGTH_LABELS[strength]}
                  </p>
                </div>
              )}
              {touched.password && pwErr && (
                <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-600 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />{pwErr}
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="flex items-center gap-1 text-sm font-semibold text-forest-800 mb-1.5">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCf ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onBlur={() => setTouched(p => ({ ...p, confirm: true }))}
                  className={inputClass(touched.confirm, cfErr) + ' pr-12'}
                  placeholder="Re-enter your password"
                />
                <button type="button" onClick={() => setShowCf(!showCf)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-forest-600 transition-colors">
                  {showCf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {touched.confirm && cfErr && (
                <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-600 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />{cfErr}
                </p>
              )}
              {touched.confirm && confirm && !cfErr && (
                <p className="flex items-center gap-1.5 mt-1.5 text-xs text-forest-600 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />Passwords match
                </p>
              )}
            </div>

            <button type="submit" disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                isValid && !loading
                  ? 'bg-gradient-to-r from-forest-600 to-forest-700 hover:from-forest-700 hover:to-forest-800 text-white shadow-lg shadow-forest-500/25 hover:-translate-y-0.5'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}>
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Setting password...</>
                : <><CheckCircle className="w-4 h-4" />Set Password & Login</>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
