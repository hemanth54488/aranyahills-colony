import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import {
  Leaf, MapPin, Users, Home as HomeIcon, TreePine,
  ArrowRight, Bell, Phone, ChevronRight, Sprout
} from 'lucide-react'

function StatCard({ icon: Icon, value, label, color }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-forest-100 flex items-center gap-4">
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <div>
        <div className="text-3xl font-display font-bold text-forest-800">{value}</div>
        <div className="text-sm text-forest-500 mt-0.5">{label}</div>
      </div>
    </div>
  )
}

function CommitteeMiniCard({ member }) {
  const { t } = useTranslation()
  const roleKey = member.role
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-forest-100 flex items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-forest-100 overflow-hidden shrink-0">
        {member.photo_url
          ? <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-forest-400 font-display text-lg font-bold">
              {member.full_name?.[0]}
            </div>
        }
      </div>
      <div className="min-w-0">
        <div className="font-medium text-forest-800 text-sm truncate">{member.full_name}</div>
        <div className="text-xs text-forest-500 mt-0.5">{t(`committee.${roleKey}`)}</div>
      </div>
    </div>
  )
}

export default function Home() {
  const { t } = useTranslation()
  const [committee, setCommittee] = useState([])
  const [notices, setNotices] = useState([])
  const [stats, setStats] = useState({ total: 26, occupied: 0, vacant: 0 })

  useEffect(() => {
    supabase
      .from('committee_members')
      .select('*')
      .eq('is_active', true)
      .order('created_at')
      .then(({ data }) => setCommittee(data ?? []))

    supabase
      .from('notices')
      .select('*')
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => setNotices(data ?? []))

    supabase
      .from('plots')
      .select('status')
      .then(({ data }) => {
        if (!data) return
        setStats({
          total: data.length,
          occupied: data.filter(p => p.status === 'occupied').length,
          vacant: data.filter(p => p.status === 'vacant').length,
        })
      })
  }, [])

  const priorityColor = { urgent: 'bg-red-100 text-red-700', general: 'bg-forest-100 text-forest-700', event: 'bg-earth-100 text-earth-700' }

  return (
    <div className="flex flex-col">

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-forest-800 via-forest-700 to-forest-600 text-white overflow-hidden">
        {/* Decorative leaves */}
        <div className="absolute inset-0 opacity-10 pointer-events-none select-none">
          <TreePine className="absolute top-6 right-12 w-32 h-32 text-white" />
          <Leaf className="absolute bottom-8 left-8 w-20 h-20 text-white rotate-45" />
          <Sprout className="absolute top-1/2 right-1/3 w-16 h-16 text-white" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-forest-900/40 backdrop-blur-sm border border-gold-400/30 text-gold-300 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
              <MapPin className="w-3 h-3" />
              {t('app.location')}
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
              {t('home.heroTitle')}
            </h1>
            <p className="text-gold-300 font-display text-xl md:text-2xl font-medium mb-3">
              {t('home.heroSubtitle')}
            </p>
            <p className="text-forest-200 text-base md:text-lg leading-relaxed mb-8">
              {t('home.heroDesc')}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/committee"
                className="inline-flex items-center gap-2 bg-gold-400 text-forest-900 font-semibold px-6 py-3 rounded-xl hover:bg-gold-500 transition-colors"
              >
                <Users className="w-4 h-4" />
                {t('nav.committee')}
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white font-medium px-6 py-3 rounded-xl hover:bg-white/20 transition-colors"
              >
                {t('nav.register')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-forest-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl text-forest-800 font-bold mb-6 text-center">
            {t('home.quickStats')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={HomeIcon} value={stats.total} label={t('home.totalPlots')} color="bg-forest-600" />
            <StatCard icon={Users} value={stats.occupied} label={t('home.occupiedPlots')} color="bg-earth-500" />
            <StatCard icon={Leaf} value={stats.total - stats.occupied} label={t('home.vacantPlots')} color="bg-forest-400" />
            <StatCard icon={Users} value={6} label={t('home.committee')} color="bg-gold-500" />
          </div>
        </div>
      </section>

      {/* Committee Preview + Notices */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* Committee */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-2xl text-forest-800 font-bold">{t('nav.committee')}</h2>
              <Link to="/committee" className="text-sm text-forest-600 hover:text-forest-800 flex items-center gap-1">
                {t('home.viewAll')} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {committee.length === 0 ? (
              <p className="text-forest-400 text-sm">No committee members added yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {committee.slice(0, 6).map(m => <CommitteeMiniCard key={m.id} member={m} />)}
              </div>
            )}
          </div>

          {/* Notices */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-2xl text-forest-800 font-bold">{t('home.latestNotices')}</h2>
              <Link to="/notices" className="text-sm text-forest-600 hover:text-forest-800 flex items-center gap-1">
                {t('home.viewAll')} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {notices.length === 0 ? (
              <div className="bg-forest-50 rounded-xl p-6 text-center">
                <Bell className="w-8 h-8 text-forest-300 mx-auto mb-2" />
                <p className="text-forest-400 text-sm">{t('notices.noNotices')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notices.map(notice => (
                  <div key={notice.id} className="bg-forest-50 border border-forest-100 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-forest-800 text-sm">{notice.title_en}</h3>
                      <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor[notice.priority]}`}>
                        {t(`notices.${notice.priority}`)}
                      </span>
                    </div>
                    <p className="text-xs text-forest-500 mt-1 line-clamp-2">{notice.content_en}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-gradient-to-r from-earth-600 to-earth-500 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-2xl md:text-3xl text-white font-bold mb-3">
            Are you a resident of Aranya Hills Colony?
          </h2>
          <p className="text-earth-100 mb-6">Register your account to access all colony features.</p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-earth-700 font-semibold px-8 py-3 rounded-xl hover:bg-earth-50 transition-colors"
          >
            {t('nav.register')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Services teaser */}
      <section className="py-12 bg-forest-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl text-forest-800 font-bold text-center mb-2">
            {t('home.ourServices')}
          </h2>
          <p className="text-center text-forest-500 text-sm mb-8">Quick contacts for colony maintenance</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {['Plumber', 'Electrician', 'Carpenter', 'Painter', 'Pest Control', 'Others'].map((svc, i) => (
              <Link
                key={svc}
                to="/services"
                className="bg-white border border-forest-100 rounded-xl p-4 text-center hover:border-forest-300 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 bg-forest-100 rounded-full mx-auto mb-2 flex items-center justify-center group-hover:bg-forest-200 transition-colors">
                  <Phone className="w-4 h-4 text-forest-600" />
                </div>
                <p className="text-xs font-medium text-forest-700">{svc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
