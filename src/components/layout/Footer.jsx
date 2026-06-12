import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapPin, Phone, Mail, Heart, ArrowRight, TreePine, BadgeCheck } from 'lucide-react'
import ColonyLogo from '../ColonyLogo'

const QUICK_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/committee', label: 'Committee' },
  { to: '/plots', label: 'Plots & Residents' },
  { to: '/notices', label: 'Notices' },
]

const MEMBER_LINKS = [
  { to: '/services', label: 'Service Providers' },
  { to: '/colony-info', label: 'Colony Info & Bylaws' },
  { to: '/login', label: 'Member Login' },
  { to: '/register', label: 'Register Account' },
]

export default function Footer() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  return (
    <footer className="relative text-forest-200 mt-auto overflow-hidden"
      style={{
        backgroundImage: `
          linear-gradient(to bottom, rgba(3,30,14,0.97), rgba(5,46,22,0.99)),
          url('https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=50')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}>

      {/* Wave divider at top */}
      <div className="w-full overflow-hidden leading-none -mb-px">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full block">
          <path d="M0,0 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,0 L0,0 Z" fill="#f0fdf4"/>
        </svg>
      </div>

      {/* Decorative top gold line */}
      <div className="h-px bg-gradient-to-r from-transparent via-gold-500/60 to-transparent" />

      {/* Decorative trees */}
      <TreePine className="absolute -left-8 bottom-8 w-48 h-48 text-forest-800/20 pointer-events-none" />
      <TreePine className="absolute -right-8 top-16 w-32 h-32 text-forest-800/15 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-5 group w-fit">
              <div className="relative">
                <div className="absolute inset-0 bg-gold-400/20 rounded-xl blur-md group-hover:bg-gold-400/35 transition-all" />
                <ColonyLogo size={56} className="relative shadow-lg drop-shadow group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div>
                <div className="font-display font-bold text-xl leading-none" style={{background:'linear-gradient(135deg,#fde68a,#fbbf24)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
                  Aranya Hills
                </div>
                <div className="text-forest-400 text-[10px] tracking-widest uppercase mt-0.5">Colony Welfare Association</div>
              </div>
            </Link>

            <p className="text-gold-400/60 text-xs font-display italic mb-2 leading-relaxed">
              అరణ్య హిల్స్ కాలనీ వెల్ఫేర్ అసోసియేషన్
            </p>
            <p className="text-gold-500/70 text-[10px] font-bold tracking-[0.2em] uppercase mb-3">
              Unity &nbsp;•&nbsp; Development &nbsp;•&nbsp; Harmony
            </p>
            <p className="text-forest-400 text-sm leading-relaxed mb-4">
              A registered welfare body dedicated to the residents of Aranya Hills Colony, Badangpet, Hyderabad.
            </p>

            {/* Registration badge */}
            <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/25 rounded-xl px-3 py-2 mb-4">
              <BadgeCheck className="w-4 h-4 text-gold-400 shrink-0" />
              <div>
                <div className="text-gold-300 text-xs font-bold tracking-wide">REG.NO: 469 OF 2026</div>
                <div className="text-forest-500 text-[10px]">Societies Registration Act</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-6 h-6 bg-forest-800/60 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-gold-400" />
              </div>
              <span className="text-forest-400 text-xs leading-relaxed">
                Badangpet, R.R. Dist, Hyderabad — 500058<br />Telangana, India
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display text-white text-base font-semibold mb-5 flex items-center gap-2">
              <span className="w-6 h-px bg-gold-500" />
              Quick Links
            </h3>
            <ul className="space-y-3">
              {QUICK_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="group flex items-center gap-2 text-sm text-forest-400 hover:text-gold-300 transition-colors">
                    <ArrowRight className="w-3 h-3 text-forest-700 group-hover:text-gold-400 group-hover:translate-x-1 transition-all" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Member Area */}
          <div>
            <h3 className="font-display text-white text-base font-semibold mb-5 flex items-center gap-2">
              <span className="w-6 h-px bg-gold-500" />
              Member Area
            </h3>
            <ul className="space-y-3">
              {MEMBER_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="group flex items-center gap-2 text-sm text-forest-400 hover:text-gold-300 transition-colors">
                    <ArrowRight className="w-3 h-3 text-forest-700 group-hover:text-gold-400 group-hover:translate-x-1 transition-all" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display text-white text-base font-semibold mb-5 flex items-center gap-2">
              <span className="w-6 h-px bg-gold-500" />
              Contact Us
            </h3>
            <div className="space-y-3">
              <a href="tel:+919999999999"
                className="group flex items-center gap-3 text-sm text-forest-400 hover:text-gold-300 transition-colors">
                <div className="w-8 h-8 bg-forest-800/60 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-gold-500/20 transition-colors">
                  <Phone className="w-3.5 h-3.5 text-gold-400" />
                </div>
                <div>
                  <div className="text-xs text-forest-500">Secretary</div>
                  <div>+91 XXXXX XXXXX</div>
                </div>
              </a>
              <a href="mailto:aranyahillscolony@gmail.com"
                className="group flex items-center gap-3 text-sm text-forest-400 hover:text-gold-300 transition-colors">
                <div className="w-8 h-8 bg-forest-800/60 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-gold-500/20 transition-colors">
                  <Mail className="w-3.5 h-3.5 text-gold-400" />
                </div>
                <div>
                  <div className="text-xs text-forest-500">Email</div>
                  <div className="text-xs break-all">aranyahillscolony@gmail.com</div>
                </div>
              </a>
            </div>

            {/* Stats pill */}
            <div className="mt-6 bg-forest-900/60 border border-forest-800/60 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                {[{ n: '26', l: 'Total Plots' }, { n: '6', l: 'Committee' }].map(({ n, l }) => (
                  <div key={l}>
                    <div className="font-display text-xl font-bold text-gold-400">{n}</div>
                    <div className="text-[10px] text-forest-500 mt-0.5">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-forest-800/50 pt-6 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-forest-600">
              © {year} <span className="text-forest-400">Aranya Hills Colony Welfare Association</span>. {t('footer.rights')}.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-forest-600">aranyahillscolony.in</span>
              <span className="text-forest-800">•</span>
              <p className="text-xs text-forest-600 flex items-center gap-1">
                Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> for our community
              </p>
            </div>
          </div>
          <p className="text-center text-[10px] text-forest-700">
            Registered under the Telangana Societies Registration Act &nbsp;·&nbsp; REG.NO: 469 OF 2026 &nbsp;·&nbsp; Badangpet, R.R. Dist, Hyderabad - 500058
          </p>
        </div>
      </div>
    </footer>
  )
}
