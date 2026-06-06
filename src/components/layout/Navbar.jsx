import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { Leaf, Menu, X, ChevronDown, LogOut, LayoutDashboard, Globe, MapPin } from 'lucide-react'

const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'te', label: 'తెలుగు', short: 'TE' },
  { code: 'hi', label: 'हिंदी', short: 'HI' },
]

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const { user, profile, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMenuOpen(false); setLangOpen(false); setUserOpen(false) }, [location.pathname])

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

  async function handleLogout() { await signOut(); navigate('/') }
  const isHome = location.pathname === '/'

  return (
    <div className="sticky top-0 z-50">

      {/* ── Top announcement bar ─────────────────────── */}
      <div className="bg-forest-950 border-b border-forest-800/60 hidden md:block"
        style={{backgroundImage:`linear-gradient(90deg,rgba(5,46,22,0.98),rgba(14,75,35,0.95)),url('https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=40')`,backgroundSize:'cover'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between">
          <div className="flex items-center gap-2 text-forest-400 text-xs">
            <div className="w-1.5 h-1.5 bg-forest-400 rounded-full animate-pulse" />
            <MapPin className="w-3 h-3 text-gold-500" />
            <span>Badangpet, Hyderabad — 500058, Telangana</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-forest-400">
            <span className="text-gold-500/70 font-display italic">అరణ్య హిల్స్ కాలనీ వెల్ఫేర్ అసోసియేషన్</span>
            <span className="text-forest-600">|</span>
            <a href="mailto:aranyahillscolony@gmail.com" className="hover:text-gold-400 transition-colors">aranyahillscolony@gmail.com</a>
          </div>
        </div>
      </div>

      {/* ── Main navbar ──────────────────────────────── */}
      <header className={`transition-all duration-500 nav-blur ${
        scrolled || !isHome
          ? 'bg-forest-950/97 shadow-[0_4px_30px_rgba(5,46,22,0.5)] border-b border-forest-800/40'
          : 'bg-forest-950/80 border-b border-white/5'
      }`}
        style={{backgroundImage:`url('https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=30')`,backgroundSize:'cover',backgroundPosition:'center'}}>

        {/* gold accent line at top */}
        <div className={`h-[2px] bg-gradient-to-r from-transparent via-gold-500 to-transparent transition-opacity duration-500 ${scrolled ? 'opacity-100' : 'opacity-0'}`} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[68px]">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-gold-400/30 rounded-xl blur-md scale-110 group-hover:bg-gold-400/50 transition-all" />
                <div className="relative w-11 h-11 bg-gradient-to-br from-gold-300 via-gold-400 to-gold-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Leaf className="w-6 h-6 text-forest-950 drop-shadow" />
                </div>
              </div>
              <div className="leading-tight">
                <div className="font-display text-lg font-bold leading-none" style={{background:'linear-gradient(135deg,#fde68a,#fbbf24,#f59e0b)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
                  Aranya Hills
                </div>
                <div className="text-[9px] text-white/70 tracking-[0.2em] uppercase mt-0.5 font-semibold">Colony Welfare Association</div>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {navLinks.map(({ to, label }) => (
                <NavLink key={to} to={to} end={to === '/'}
                  className={({ isActive }) =>
                    `relative px-4 py-2.5 text-sm font-semibold transition-all duration-200 group ${
                      isActive ? 'text-gold-400' : 'text-white/90 hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {label}
                      <span className={`absolute bottom-0 left-3 right-3 h-[2px] rounded-full transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-r from-gold-400 to-gold-600 opacity-100 scale-x-100'
                          : 'bg-gold-400/50 opacity-0 scale-x-0 group-hover:opacity-60 group-hover:scale-x-100'
                      }`} />
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Right actions */}
            <div className="hidden lg:flex items-center gap-1">

              {/* Language */}
              <div className="relative">
                <button onClick={() => { setLangOpen(!langOpen); setUserOpen(false) }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 transition-all">
                  <Globe className="w-3.5 h-3.5" />
                  <span className="font-semibold text-xs">{LANGUAGES.find(l => l.code === i18n.language)?.short ?? 'EN'}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
                </button>
                {langOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-forest-950/98 nav-blur rounded-2xl shadow-[0_20px_60px_rgba(5,46,22,0.7)] border border-forest-700/40 overflow-hidden z-50">
                    {LANGUAGES.map(lang => (
                      <button key={lang.code} onClick={() => { i18n.changeLanguage(lang.code); setLangOpen(false) }}
                        className={`w-full text-left px-4 py-3 text-sm transition-all flex items-center gap-3 ${
                          i18n.language === lang.code
                            ? 'text-gold-400 bg-forest-800/60 font-semibold border-l-2 border-gold-400'
                            : 'text-forest-200 hover:bg-forest-800/40 hover:text-white border-l-2 border-transparent'
                        }`}>
                        <span className="text-xs font-black w-5 text-forest-400">{lang.short}</span>
                        <span>{lang.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="w-px h-5 bg-forest-700/60 mx-1" />

              {/* Auth */}
              {user ? (
                <div className="relative">
                  <button onClick={() => { setUserOpen(!userOpen); setLangOpen(false) }}
                    className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 transition-all text-sm">
                    <div className="w-8 h-8 bg-gradient-to-br from-gold-300 to-gold-600 rounded-lg flex items-center justify-center shadow-sm shadow-gold-500/20">
                      <span className="text-forest-950 font-black text-xs">{profile?.full_name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="text-left hidden xl:block">
                      <div className="text-white text-xs font-semibold leading-none truncate max-w-20">{profile?.full_name?.split(' ')[0]}</div>
                      <div className="text-forest-400 text-[10px] capitalize mt-0.5">{profile?.role}</div>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-forest-300 transition-transform duration-200 ${userOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {userOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-forest-950/98 nav-blur rounded-2xl shadow-[0_20px_60px_rgba(5,46,22,0.7)] border border-forest-700/40 overflow-hidden z-50">
                      <div className="px-5 py-4 border-b border-forest-800/60 bg-forest-900/40">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-gold-300 to-gold-600 rounded-xl flex items-center justify-center">
                            <span className="text-forest-950 font-black text-sm">{profile?.full_name?.[0]?.toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm truncate">{profile?.full_name}</p>
                            <p className="text-gold-400/70 text-xs capitalize">{profile?.role}</p>
                          </div>
                        </div>
                      </div>
                      {isAdmin && (
                        <Link to="/admin" className="flex items-center gap-3 px-5 py-3.5 text-sm text-forest-200 hover:bg-forest-800/50 hover:text-white transition-colors group">
                          <div className="w-7 h-7 bg-gold-500/20 rounded-lg flex items-center justify-center group-hover:bg-gold-500/30 transition-colors">
                            <LayoutDashboard className="w-3.5 h-3.5 text-gold-400" />
                          </div>
                          {t('nav.admin')}
                        </Link>
                      )}
                      <div className="border-t border-forest-800/60" />
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors group">
                        <div className="w-7 h-7 bg-red-500/10 rounded-lg flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                          <LogOut className="w-3.5 h-3.5" />
                        </div>
                        {t('nav.logout')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login"
                    className="px-4 py-2 text-sm font-semibold text-white/90 hover:text-white transition-colors">
                    {t('nav.login')}
                  </Link>
                  <Link to="/register"
                    className="relative px-5 py-2 text-sm font-bold text-forest-950 rounded-xl overflow-hidden group"
                    style={{background:'linear-gradient(135deg,#fde68a,#fbbf24,#f59e0b)'}}>
                    <span className="relative z-10">{t('nav.register')}</span>
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile toggle */}
            <button className="lg:hidden p-2 rounded-xl text-forest-200 hover:bg-forest-800/40 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}>
              <div className={`transition-all duration-300 ${menuOpen ? 'rotate-90 scale-90' : ''}`}>
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </div>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-forest-800/40 bg-forest-950/98 nav-blur">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              {navLinks.map(({ to, label }) => (
                <NavLink key={to} to={to} end={to === '/'} onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-forest-800/60 text-gold-400 border-l-2 border-gold-400 pl-3'
                        : 'text-white/85 hover:bg-forest-800/30 hover:text-white border-l-2 border-transparent pl-3'
                    }`
                  }>{label}</NavLink>
              ))}
              <div className="pt-3 pb-1 border-t border-forest-800/50 flex items-center gap-2 px-2">
                <Globe className="w-3.5 h-3.5 text-forest-500" />
                {LANGUAGES.map(lang => (
                  <button key={lang.code}
                    onClick={() => { i18n.changeLanguage(lang.code); setMenuOpen(false) }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      i18n.language === lang.code ? 'bg-gradient-to-r from-gold-400 to-gold-500 text-forest-950 shadow-sm' : 'text-forest-300 hover:bg-forest-800/60'
                    }`}>{lang.short}</button>
                ))}
              </div>
              {user ? (
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
                  <LogOut className="w-4 h-4" />{t('nav.logout')}
                </button>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Link to="/login" onClick={() => setMenuOpen(false)}
                    className="flex-1 text-center py-3 text-sm font-medium text-forest-200 border border-forest-700/50 rounded-xl hover:bg-forest-800/40 transition-colors">
                    {t('nav.login')}
                  </Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)}
                    className="flex-1 text-center py-3 text-sm font-bold rounded-xl text-forest-950"
                    style={{background:'linear-gradient(135deg,#fde68a,#fbbf24,#f59e0b)'}}>
                    {t('nav.register')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </div>
  )
}
