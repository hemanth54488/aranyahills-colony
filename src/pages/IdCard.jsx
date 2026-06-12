import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Leaf, Download, ArrowLeft, QrCode } from 'lucide-react'

function QRCodePlaceholder({ value, size = 80 }) {
  return (
    <div
      className="bg-white border-2 border-forest-200 rounded-lg flex items-center justify-center"
      style={{ width: size, height: size }}
      title={value}
    >
      <QrCode className="w-10 h-10 text-forest-600 opacity-70" />
    </div>
  )
}

export default function IdCard() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const cardRef = useRef(null)

  const memberYear = profile?.created_at
    ? new Date(profile.created_at).getFullYear()
    : new Date().getFullYear()

  const roleColors = {
    admin: 'from-gold-400 to-gold-600',
    committee: 'from-forest-500 to-forest-700',
    resident: 'from-forest-600 to-forest-800',
    security: 'from-blue-500 to-blue-700',
  }
  const gradient = roleColors[profile?.role] ?? roleColors.resident

  function printCard() {
    const printContents = cardRef.current?.innerHTML
    const w = window.open('', '', 'width=700,height=500')
    w.document.write(`
      <html><head><title>ID Card</title>
      <script src="https://cdn.tailwindcss.com"></script>
      </head><body class="flex items-center justify-center min-h-screen bg-gray-100">
      ${printContents}
      </body></html>
    `)
    w.document.close()
    w.focus()
    setTimeout(() => { w.print(); w.close() }, 500)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/profile" className="p-2 rounded-xl text-forest-500 hover:bg-forest-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-display text-2xl font-bold text-forest-800">{t('idcard.title')}</h1>
      </div>

      {/* ID Card */}
      <div ref={cardRef}>
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-forest-200 max-w-md mx-auto">
          {/* Card header */}
          <div className={`bg-gradient-to-r ${gradient} px-6 py-5`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-white font-display font-bold text-base leading-tight">Aranya Hills Colony</div>
                  <div className="text-white/70 text-[10px] tracking-widest uppercase">Welfare Association</div>
                </div>
              </div>
              <div className="text-white/60 text-xs font-mono">#{profile?.plots?.plot_number ?? '—'}</div>
            </div>
          </div>

          {/* Card body */}
          <div className="bg-white px-6 py-5 flex items-start justify-between gap-4">
            <div className="flex-1">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-300 to-gold-500 flex items-center justify-center overflow-hidden mb-4 border-2 border-forest-100 shadow-sm">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <span className="text-forest-950 font-black text-2xl">{profile?.full_name?.[0]?.toUpperCase()}</span>
                }
              </div>

              <p className="font-display font-bold text-forest-900 text-xl leading-tight">{profile?.full_name}</p>
              <p className="text-forest-500 text-xs capitalize mt-0.5 font-medium">{profile?.role}</p>

              <div className="mt-4 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wide text-forest-400 w-16 shrink-0">{t('idcard.plotNo')}</span>
                  <span className="text-sm font-bold text-forest-700">{profile?.plots?.plot_number ?? '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wide text-forest-400 w-16 shrink-0">Phone</span>
                  <span className="text-sm text-forest-700">{profile?.phone ?? '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wide text-forest-400 w-16 shrink-0">{t('idcard.memberSince')}</span>
                  <span className="text-sm text-forest-700">{memberYear}</span>
                </div>
              </div>
            </div>

            {/* QR code */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <QRCodePlaceholder
                value={`aranyahillscolony.in/plots/${profile?.plot_id}`}
                size={88}
              />
              <span className="text-[9px] text-forest-400 text-center">{t('idcard.scanQr')}</span>
            </div>
          </div>

          {/* Card footer */}
          <div className="bg-forest-50 border-t border-forest-100 px-6 py-2.5 flex items-center justify-between">
            <span className="text-[10px] text-forest-400">{t('idcard.validId')}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              profile?.status === 'approved' ? 'bg-forest-100 text-forest-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {profile?.status?.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6 max-w-md mx-auto">
        <button onClick={printCard}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-forest-700 hover:bg-forest-800 text-white font-semibold text-sm rounded-xl transition-colors">
          <Download className="w-4 h-4" />
          {t('idcard.download')}
        </button>
        <Link to="/profile"
          className="flex-1 flex items-center justify-center gap-2 py-3 border border-forest-200 text-forest-600 hover:bg-forest-50 font-semibold text-sm rounded-xl transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {t('common.back')}
        </Link>
      </div>
    </div>
  )
}
