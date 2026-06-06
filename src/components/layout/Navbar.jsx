import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import {
  Leaf, Menu, X, ChevronDown, LogOut, User,
  LayoutDashboard, Globe
} from 'lucide-react'

const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'te', label: 'తెలుగు', short: 'TE' },
  { code: 'hi', label: 'हिंदी', short: 'HI' },
]

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const { user, profile, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/committee', label: t('nav.committee') },
    { to: '/notices', label: t('nav.notices') },
    ...(user ? [
      { to: '/plots', label: t('nav.plots') },
      { to: '/colony-info', label: t('nav.colonyInfo') },
      { to: '/services', label: t('nav.services') },
    ] : []),
  ]

  async function handleLogout() {
    await signOut()
    navigate('/')
    setUserOpen(false)
  }

  return (
    <header className="bg-forest-800 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gold-400 rounded-full flex items-center justify-center">
              <Leaf className="w-5 h-5 text-forest-800" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-base font-bold text-gold-400 leading-none">Aranya Hills</div>
              <div className="text-forest-200 text-xs">Colony Welfare Association</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-forest-600 text-gold-400'
                      : 'text-forest-100 hover:bg-forest-700 hover:text-white'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-2">
            {/* Language picker */}
            <div className="relative">
              <button
                onClick={() => { setLangOpen(!langOpen); setUserOpen(false) }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-forest-100 hover:bg-forest-700 transition-colors"
              >
                <Globe className="w-4 h-4" />
                {LANGUAGES.find(l => l.code === i18n.language)?.short ?? 'EN'}
                <ChevronDown className="w-3 h-3" />
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-xl border border-forest-100 overflow-hidden z-50">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => { i18n.changeLanguage(lang.code); setLangOpen(false) }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        i18n.language === lang.code
                          ? 'bg-forest-50 text-forest-700 font-medium'
                          : 'text-gray-700 hover:bg-forest-50'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auth buttons */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => { setUserOpen(!userOpen); setLangOpen(false) }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-forest-100 hover:bg-forest-700 transition-colors"
                >
                  <div className="w-7 h-7 bg-gold-400 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-forest-800" />
                  </div>
                  <span className="max-w-24 truncate">{profile?.full_name?.split(' ')[0]}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                {userOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-forest-100 overflow-hidden z-50">
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-forest-50"
                      >
                        <LayoutDashboard className="w-4 h-4 text-forest-600" />
                        {t('nav.admin')}
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  className="px-4 py-1.5 text-sm font-medium text-forest-100 hover:text-white transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 text-sm font-medium bg-gold-400 text-forest-900 rounded-lg hover:bg-gold-500 transition-colors"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-forest-100 hover:bg-forest-700"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-forest-900 border-t border-forest-700 px-4 py-3 space-y-1">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-forest-600 text-gold-400' : 'text-forest-100'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <div className="pt-2 border-t border-forest-700 flex gap-3">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => { i18n.changeLanguage(lang.code); setMenuOpen(false) }}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  i18n.language === lang.code ? 'bg-gold-400 text-forest-900' : 'text-forest-300'
                }`}
              >
                {lang.short}
              </button>
            ))}
          </div>
          {user ? (
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 text-sm text-red-400"
            >
              {t('nav.logout')}
            </button>
          ) : (
            <div className="flex gap-2 pt-1">
              <Link to="/login" onClick={() => setMenuOpen(false)}
                className="flex-1 text-center py-2 text-sm text-forest-100">
                {t('nav.login')}
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}
                className="flex-1 text-center py-2 text-sm bg-gold-400 text-forest-900 rounded-lg font-medium">
                {t('nav.register')}
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
