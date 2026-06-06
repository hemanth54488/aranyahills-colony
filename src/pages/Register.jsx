import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { Leaf, Eye, EyeOff, UserPlus } from 'lucide-react'

export default function Register() {
  const { t } = useTranslation()
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [plots, setPlots] = useState([])
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', plotId: '', password: '', confirmPassword: '',
  })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('plots').select('id, plot_number, status').order('plot_number')
      .then(({ data }) => setPlots(data ?? []))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      await signUp({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        phone: form.phone,
        plotId: form.plotId || null,
      })
      toast.success(t('auth.registerSuccess'))
      navigate('/login')
    } catch (err) {
      toast.error(err.message ?? t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-forest-50 to-forest-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-forest-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-forest-700 to-forest-600 px-8 pt-8 pb-6 text-white">
            <div className="w-12 h-12 bg-gold-400 rounded-full flex items-center justify-center mb-4">
              <Leaf className="w-6 h-6 text-forest-800" />
            </div>
            <h1 className="font-display text-2xl font-bold">{t('auth.register')}</h1>
            <p className="text-forest-200 text-sm mt-1">{t('app.fullName')}</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1.5">{t('auth.fullName')}</label>
              <input
                type="text" required
                value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                className="w-full px-4 py-2.5 border border-forest-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
                placeholder="e.g. Ravi Kumar"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1.5">{t('auth.phone')}</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-forest-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
                placeholder="+91 XXXXX XXXXX"
              />
            </div>

            {/* Plot */}
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1.5">{t('auth.plotNumber')}</label>
              <select
                value={form.plotId}
                onChange={e => setForm({ ...form, plotId: e.target.value })}
                className="w-full px-4 py-2.5 border border-forest-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-400 bg-white"
              >
                <option value="">-- Select your plot --</option>
                {plots.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.plot_number} ({p.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1.5">{t('auth.email')}</label>
              <input
                type="email" required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-forest-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
                placeholder="your@email.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1.5">{t('auth.password')}</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-2.5 pr-10 border border-forest-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-forest-400">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1.5">{t('auth.confirmPassword')}</label>
              <input
                type="password" required
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full px-4 py-2.5 border border-forest-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
                placeholder="••••••••"
              />
            </div>

            <div className="bg-earth-50 border border-earth-200 rounded-xl p-3">
              <p className="text-xs text-earth-700">
                After registration, the Secretary will review and approve your account. You will receive an email once approved.
              </p>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-forest-700 hover:bg-forest-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
            >
              {loading
                ? <span className="animate-pulse">{t('common.loading')}</span>
                : <><UserPlus className="w-4 h-4" />{t('auth.registerBtn')}</>
              }
            </button>

            <p className="text-center text-sm text-forest-500">
              {t('auth.hasAccount')}{' '}
              <Link to="/login" className="text-forest-700 font-medium hover:underline">{t('auth.loginBtn')}</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
