import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Leaf, Eye, EyeOff, LogIn } from 'lucide-react'

export default function Login() {
  const { t } = useTranslation()
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn(form.email, form.password)
      toast.success(t('auth.loginSuccess'))
      navigate('/')
    } catch {
      toast.error(t('auth.invalidCredentials'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-forest-50 to-forest-100 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-forest-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-forest-700 to-forest-600 px-8 pt-8 pb-6 text-white">
            <div className="w-12 h-12 bg-gold-400 rounded-full flex items-center justify-center mb-4">
              <Leaf className="w-6 h-6 text-forest-800" />
            </div>
            <h1 className="font-display text-2xl font-bold">{t('auth.login')}</h1>
            <p className="text-forest-200 text-sm mt-1">{t('app.fullName')}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1.5">
                {t('auth.email')}
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-forest-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-400 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1.5">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-2.5 pr-10 border border-forest-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-forest-400"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-forest-700 hover:bg-forest-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
            >
              {loading ? (
                <span className="animate-pulse">{t('common.loading')}</span>
              ) : (
                <><LogIn className="w-4 h-4" />{t('auth.loginBtn')}</>
              )}
            </button>

            <p className="text-center text-sm text-forest-500">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="text-forest-700 font-medium hover:underline">
                {t('auth.registerBtn')}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
