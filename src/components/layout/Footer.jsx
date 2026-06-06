import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Leaf, MapPin, Phone, Mail, Heart } from 'lucide-react'

export default function Footer() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  return (
    <footer className="bg-forest-900 text-forest-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 bg-gold-400 rounded-full flex items-center justify-center">
                <Leaf className="w-5 h-5 text-forest-800" />
              </div>
              <div>
                <div className="font-display text-gold-400 font-bold text-base">Aranya Hills</div>
                <div className="text-xs text-forest-400">Colony Welfare Association</div>
              </div>
            </div>
            <p className="text-sm text-forest-400 leading-relaxed">
              {t('app.tagline')}
            </p>
            <div className="mt-3 flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gold-400 mt-0.5 shrink-0" />
              <span className="text-forest-400">{t('footer.address')}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display text-white text-base mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { to: '/', label: t('nav.home') },
                { to: '/committee', label: t('nav.committee') },
                { to: '/plots', label: t('nav.plots') },
                { to: '/notices', label: t('nav.notices') },
                { to: '/services', label: t('nav.services') },
                { to: '/colony-info', label: t('nav.colonyInfo') },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm text-forest-400 hover:text-gold-400 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display text-white text-base mb-4">{t('footer.contact')}</h3>
            <div className="space-y-3">
              <a
                href="tel:+919999999999"
                className="flex items-center gap-2 text-sm text-forest-400 hover:text-gold-400 transition-colors"
              >
                <Phone className="w-4 h-4 text-gold-400" />
                Secretary: +91 XXXXX XXXXX
              </a>
              <a
                href="mailto:aranyahillscolony@gmail.com"
                className="flex items-center gap-2 text-sm text-forest-400 hover:text-gold-400 transition-colors"
              >
                <Mail className="w-4 h-4 text-gold-400" />
                aranyahillscolony@gmail.com
              </a>
            </div>

            <div className="mt-6">
              <p className="text-xs text-forest-500">Domain: aranyahillscolony.in</p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-forest-800 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-forest-500">
            © {year} Aranya Hills Colony Welfare Association. {t('footer.rights')}.
          </p>
          <p className="text-xs text-forest-500 flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-400" /> for our colony
          </p>
        </div>
      </div>
    </footer>
  )
}
