import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import notify from '../lib/notify'
import { Leaf, Eye, EyeOff, LogIn, TreePine, Sprout, Shield, Users, Home as HomeIcon, AlertCircle, CheckCircle } from 'lucide-react'

const FEATURES = [
  { icon: Shield,   text: 'Secure resident portal' },
  { icon: Users,    text: 'Connect with neighbours' },
  { icon: HomeIcon, text: 'Manage your plot info' },
  { icon: Leaf,     text: 'Colony news & notices' },
]

function validateEmail(v) {
  if (!v.trim()) return 'Email address is required'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email (e.g. name@gmail.com)'
  return ''
}
function validatePassword(v) {
  if (!v) return 'Password is required'
  if (v.length < 6) return 'Password must be at least 6 characters'
  return ''
}

function inputClass(touched, error) {
  const base = 'w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none transition-all duration-200 bg-white font-medium'
  if (!touched) return `${base} border-gray-200 focus:border-forest-400 focus:ring-4 focus:ring-forest-100`
  if (error)    return `${base} border-red-400 bg-red-50/30 focus:border-red-400 focus:ring-4 focus:ring-red-100`
  return              `${base} border-forest-400 bg-forest-50/30 focus:border-forest-500 focus:ring-4 focus:ring-forest-100`
}

export default function Login() {
  const { t } = useTranslation()
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [touched, setTouched] = useState({ email: false, password: false })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const emailErr = validateEmail(form.email)
  const passErr  = validatePassword(form.password)
  const isValid  = !emailErr && !passErr

  function touch(field) { setTouched(prev => ({ ...prev, [field]: true })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setTouched({ email: true, password: true })
    if (!isValid) return
    setLoading(true)
    try {
      await signIn(form.email, form.password)
      notify.success('Login Successful', 'Welcome back to Aranya Hills Colony portal!', { duration: 3000 })
      navigate('/')
    } catch (err) {
      const msg = err?.message ?? ''
      if (msg.includes('Invalid login') || msg.includes('invalid_credentials')) {
        notify.error('Incorrect Credentials', 'The email or password you entered is wrong. Please try again.')
        setTouched({ email: true, password: true })
      } else if (msg.includes('Email not confirmed')) {
        notify.warning('Email Not Verified', 'Please confirm your email address before logging in. Check your inbox.', { duration: 6000 })
      } else if (msg.includes('Too many')) {
        notify.warning('Too Many Attempts', 'Please wait a few minutes before trying again.')
      } else {
        notify.error('Login Failed', msg || 'Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">

      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(to bottom,rgba(5,46,22,0.88),rgba(14,75,35,0.75),rgba(5,46,22,0.92)),url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=85')`,
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}>
        <div className="absolute inset-0 opacity-[0.04]"
          style={{backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.8) 1px,transparent 1px)',backgroundSize:'28px 28px'}} />
        <TreePine className="animate-float  absolute top-8 right-8  w-32 h-32 text-forest-400/25 pointer-events-none" />
        <Sprout   className="animate-float2 absolute bottom-24 left-8 w-20 h-20 text-forest-300/20 pointer-events-none" />

        <div className="relative">
          <div className="w-14 h-14 bg-gradient-to-br from-gold-300 to-gold-600 rounded-2xl flex items-center justify-center shadow-lg shadow-gold-500/30 animate-pulse-ring mb-6">
            <Leaf className="w-7 h-7 text-forest-950" />
          </div>
          <h1 className="font-display text-4xl font-bold text-white leading-tight mb-2">Aranya Hills</h1>
          <p className="font-display text-xl font-semibold mb-1" style={{background:'linear-gradient(135deg,#fde68a,#fbbf24)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
            Colony Welfare Association
          </p>
          <p className="text-forest-300 text-sm">Badangpet, Hyderabad</p>
          <p className="text-gold-300/60 text-xs mt-1 tracking-widest font-display italic">అరణ్య హిల్స్ కాలనీ</p>
        </div>

        <div className="relative space-y-3">
          <p className="text-forest-300 text-xs font-bold uppercase tracking-widest mb-4">Why join our portal?</p>
          {FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 glass rounded-xl px-4 py-3">
              <div className="w-8 h-8 bg-forest-600/50 rounded-lg flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-gold-300" />
              </div>
              <span className="text-white/90 text-sm font-medium">{text}</span>
            </div>
          ))}
        </div>

        <p className="relative text-forest-500 text-xs">© 2025 Aranya Hills Colony Welfare Association</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center bg-mesh px-6 py-12">
        <div className="w-full max-w-md animate-fade-up">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl flex items-center justify-center">
              <Leaf className="w-5 h-5 text-forest-950" />
            </div>
            <div>
              <div className="font-display font-bold text-forest-900">Aranya Hills</div>
              <div className="text-forest-500 text-xs">Colony Welfare Association</div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-3xl font-bold text-forest-900">Welcome back</h2>
            <p className="text-gray-500 mt-2 text-sm font-medium">Sign in to access your colony portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Email */}
            <div>
              <label className="flex items-center gap-1 text-sm font-semibold text-forest-800 mb-1.5">
                Email Address <span className="text-red-500 text-xs">*</span>
              </label>
              <input type="email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                onBlur={() => touch('email')}
                className={inputClass(touched.email, emailErr) + ' pr-10'}
                placeholder="yourname@gmail.com" autoComplete="email" />
              {touched.email && emailErr && (
                <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-600 font-medium animate-fade-up">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />{emailErr}
                </p>
              )}
              {touched.email && !emailErr && (
                <p className="flex items-center gap-1.5 mt-1.5 text-xs text-forest-600 font-medium animate-fade-up">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />Valid email address
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="flex items-center gap-1 text-sm font-semibold text-forest-800 mb-1.5">
                Password <span className="text-red-500 text-xs">*</span>
              </label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  onBlur={() => touch('password')}
                  className={inputClass(touched.password, passErr) + ' pr-12'}
                  placeholder="Enter your password" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-forest-600 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {touched.password && passErr && (
                <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-600 font-medium animate-fade-up">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />{passErr}
                </p>
              )}
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                isValid && !loading
                  ? 'bg-gradient-to-r from-forest-600 to-forest-700 hover:from-forest-700 hover:to-forest-800 text-white shadow-lg shadow-forest-500/25 hover:-translate-y-0.5'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}>
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
                : <><LogIn className="w-4 h-4" />{t('auth.loginBtn')}</>
              }
            </button>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <p className="text-center text-sm text-gray-500">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="text-forest-700 font-bold hover:text-forest-900 transition-colors">{t('auth.registerBtn')}</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
