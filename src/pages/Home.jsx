import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { Leaf, MapPin, Users, Home as HomeIcon, TreePine, ArrowRight, Bell, ChevronRight, Sprout, Star, Shield, Award } from 'lucide-react'

function useCountUp(target, duration = 1800) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      let start = 0; const step = target / (duration / 16)
      const timer = setInterval(() => {
        start += step
        if (start >= target) { setCount(target); clearInterval(timer) } else setCount(Math.floor(start))
      }, 16)
      observer.disconnect()
    }, { threshold: 0.3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])
  return [count, ref]
}

function StatCard({ icon: Icon, value, label, color, delay }) {
  const [count, ref] = useCountUp(typeof value === 'number' ? value : 0)
  return (
    <div ref={ref} className={`relative group bg-card-premium rounded-2xl p-6 card-hover stat-card-glow overflow-hidden animate-fade-up ${delay}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-forest-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg ${color}`}>
        <Icon className="w-7 h-7 text-white drop-shadow" />
      </div>
      <div className="text-4xl font-display font-bold text-forest-900 leading-none">{typeof value === 'number' ? count : value}</div>
      <div className="text-sm text-forest-500 mt-2 font-medium">{label}</div>
    </div>
  )
}

const ROLE_BADGE = {
  president: 'bg-gradient-to-r from-gold-400 to-gold-600 text-forest-950',
  vice_president: 'bg-forest-700 text-white',
  general_secretary: 'bg-forest-800 text-white',
  joint_secretary: 'bg-earth-600 text-white',
  treasurer: 'bg-forest-600 text-white',
  executive_member: 'bg-forest-500 text-white',
}

function CommitteeMiniCard({ member, delay }) {
  const { t } = useTranslation()
  return (
    <div className={`group bg-card-premium rounded-2xl p-4 card-hover overflow-hidden animate-fade-up ${delay}`}>
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-forest-200 to-forest-300 overflow-hidden">
            {member.photo_url
              ? <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-forest-600 font-display text-xl font-bold">{member.full_name?.[0]}</div>
            }
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-forest-500 rounded-full flex items-center justify-center border-2 border-white">
            <Star className="w-2.5 h-2.5 text-white fill-white" />
          </div>
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-forest-900 text-sm truncate">{member.full_name}</div>
          <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_BADGE[member.role] ?? 'bg-forest-100 text-forest-700'}`}>
            {t(`committee.${member.role}`)}
          </span>
        </div>
      </div>
    </div>
  )
}

const SERVICES = [
  { label: 'Plumber', icon: '🔧', color: 'from-blue-500 to-blue-700' },
  { label: 'Electrician', icon: '⚡', color: 'from-yellow-500 to-orange-600' },
  { label: 'Carpenter', icon: '🪚', color: 'from-amber-700 to-amber-900' },
  { label: 'Painter', icon: '🎨', color: 'from-purple-500 to-purple-700' },
  { label: 'Pest Control', icon: '🛡️', color: 'from-green-600 to-green-800' },
  { label: 'Others', icon: '🔩', color: 'from-gray-500 to-gray-700' },
]

export default function Home() {
  const { t } = useTranslation()
  const [committee, setCommittee] = useState([])
  const [notices, setNotices] = useState([])
  const [stats, setStats] = useState({ total: 26, occupied: 0, vacant: 0 })

  useEffect(() => {
    supabase.from('committee_members').select('*').eq('is_active', true).order('created_at').then(({ data }) => setCommittee(data ?? []))
    supabase.from('notices').select('*').or('expires_at.is.null,expires_at.gt.' + new Date().toISOString()).order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(3).then(({ data }) => setNotices(data ?? []))
    supabase.from('plots').select('status').then(({ data }) => {
      if (!data) return
      setStats({ total: data.length, occupied: data.filter(p => p.status === 'occupied').length, vacant: data.filter(p => p.status === 'vacant').length })
    })
  }, [])

  const PRIORITY_STYLES = {
    urgent: { badge: 'bg-red-100 text-red-700 border border-red-200', dot: 'bg-red-500' },
    general: { badge: 'bg-forest-100 text-forest-700 border border-forest-200', dot: 'bg-forest-500' },
    event: { badge: 'bg-earth-100 text-earth-700 border border-earth-200', dot: 'bg-earth-500' },
  }

  return (
    <div className="flex flex-col">

      {/* HERO */}
      <section className="relative bg-hero text-white min-h-[88vh] flex items-center overflow-hidden"
        style={{
          backgroundImage: `
            linear-gradient(to bottom right, rgba(5,46,22,0.82), rgba(14,75,35,0.70), rgba(5,46,22,0.88)),
            url('https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=85')
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-white/5 animate-spin-slow pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full border border-white/5 pointer-events-none" style={{animation:'spin-slow 18s linear infinite reverse'}} />
        <TreePine className="animate-float  absolute top-10 right-[8%]   w-28 h-28 text-forest-400/30 pointer-events-none" />
        <Leaf     className="animate-float2 absolute top-[30%] right-[20%] w-16 h-16 text-gold-400/20 rotate-45 pointer-events-none" />
        <Sprout   className="animate-float3 absolute bottom-[20%] left-[5%] w-20 h-20 text-forest-300/25 pointer-events-none" />
        <Leaf     className="animate-float  absolute bottom-[10%] right-[12%] w-12 h-12 text-forest-200/20 -rotate-12 pointer-events-none" style={{animationDelay:'3s'}} />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{backgroundImage:'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)',backgroundSize:'60px 60px'}} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="max-w-3xl">
            <div className="animate-fade-up inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8">
              <div className="w-2 h-2 bg-forest-400 rounded-full animate-pulse" />
              <MapPin className="w-3.5 h-3.5 text-gold-300" />
              <span className="text-forest-200 text-xs font-medium">{t('app.location')}</span>
            </div>
            <p className="animate-fade-up delay-100 text-gold-300/70 text-sm font-medium tracking-widest mb-3 uppercase">అరణ్య హిల్స్ కాలనీ వెల్ఫేర్ అసోసియేషన్</p>
            <h1 className="animate-fade-up delay-200 font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mb-5">
              <span className="text-white">Welcome to </span>
              <span className="text-gradient-gold">Aranya Hills</span>
            </h1>
            <p className="animate-fade-up delay-300 text-forest-200 text-lg md:text-xl leading-relaxed max-w-xl mb-10">
              A thriving green community in Badangpet, Hyderabad — where nature meets neighbourhood.
            </p>
            <div className="animate-fade-up delay-400 flex flex-wrap gap-2 mb-10">
              {[{icon:Shield,label:'Secure Community'},{icon:Leaf,label:'26 Premium Plots'},{icon:Award,label:'Welfare Association'}].map(({icon:Icon,label}) => (
                <div key={label} className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5 text-xs text-forest-100 font-medium">
                  <Icon className="w-3.5 h-3.5 text-gold-300" />{label}
                </div>
              ))}
            </div>
            <div className="animate-fade-up delay-500 flex flex-wrap gap-3">
              <Link to="/committee" className="btn-primary shine"><Users className="w-4 h-4" /> View Committee</Link>
              <Link to="/register" className="btn-glass">Join Our Community <ArrowRight className="w-4 h-4" /></Link>
            </div>
          </div>
        </div>
        <div className="wave-divider absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,40 C360,0 1080,80 1440,40 L1440,60 L0,60 Z" fill="#f0fdf4"/>
          </svg>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-mesh py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="inline-block bg-forest-100 text-forest-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">Colony at a Glance</span>
            <h2 className="font-display text-3xl md:text-4xl text-forest-900 font-bold">{t('home.quickStats')}</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatCard icon={HomeIcon} value={stats.total}    label={t('home.totalPlots')}    color="bg-gradient-to-br from-forest-500 to-forest-700" delay="delay-100" />
            <StatCard icon={Users}    value={stats.occupied} label={t('home.occupiedPlots')} color="bg-gradient-to-br from-earth-500 to-earth-700"   delay="delay-200" />
            <StatCard icon={Leaf}     value={stats.vacant}   label={t('home.vacantPlots')}   color="bg-gradient-to-br from-forest-400 to-forest-600" delay="delay-300" />
            <StatCard icon={Award}    value={6}              label={t('home.committee')}     color="bg-gradient-to-br from-gold-400 to-gold-600"     delay="delay-400" />
          </div>
        </div>
      </section>

      {/* COMMITTEE + NOTICES */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-xs font-bold text-forest-500 uppercase tracking-wider">Our Leaders</span>
                  <h2 className="font-display text-2xl md:text-3xl text-forest-900 font-bold mt-1">{t('nav.committee')}</h2>
                </div>
                <Link to="/committee" className="flex items-center gap-1 text-sm font-semibold text-forest-600 hover:text-forest-800 bg-forest-50 hover:bg-forest-100 px-3 py-1.5 rounded-xl transition-colors">
                  {t('home.viewAll')} <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              {committee.length === 0 ? (
                <div className="bg-forest-50 rounded-2xl p-10 text-center border border-forest-100 border-dashed">
                  <Users className="w-10 h-10 text-forest-300 mx-auto mb-3" />
                  <p className="text-forest-400 text-sm">Committee members will appear here once added by admin.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {committee.slice(0, 6).map((m, i) => <CommitteeMiniCard key={m.id} member={m} delay={`delay-${(i+1)*100}`} />)}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-xs font-bold text-forest-500 uppercase tracking-wider">Latest Updates</span>
                  <h2 className="font-display text-2xl md:text-3xl text-forest-900 font-bold mt-1">{t('home.latestNotices')}</h2>
                </div>
                <Link to="/notices" className="flex items-center gap-1 text-sm font-semibold text-forest-600 hover:text-forest-800 bg-forest-50 hover:bg-forest-100 px-3 py-1.5 rounded-xl transition-colors">
                  {t('home.viewAll')} <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              {notices.length === 0 ? (
                <div className="bg-forest-50 rounded-2xl p-10 text-center border border-forest-100 border-dashed">
                  <Bell className="w-10 h-10 text-forest-300 mx-auto mb-3" />
                  <p className="text-forest-400 text-sm">{t('notices.noNotices')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notices.map((notice, i) => {
                    const s = PRIORITY_STYLES[notice.priority] ?? PRIORITY_STYLES.general
                    return (
                      <div key={notice.id} className={`bg-card-premium rounded-2xl p-5 card-hover animate-fade-up delay-${(i+1)*100}`}>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full shrink-0 mt-0.5 ${s.dot}`} />
                            <h3 className="font-semibold text-forest-900 text-sm leading-snug">{notice.title_en}</h3>
                          </div>
                          <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${s.badge}`}>{t(`notices.${notice.priority}`)}</span>
                        </div>
                        <p className="text-xs text-forest-500 leading-relaxed line-clamp-2 pl-4">{notice.content_en}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative bg-section-dark py-20 overflow-hidden"
        style={{
          backgroundImage: `
            linear-gradient(135deg, rgba(5,46,22,0.92), rgba(20,83,45,0.88)),
            url('https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=1920&q=80')
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}>
        <div className="absolute inset-0 opacity-[0.04]"
          style={{backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.8) 1px,transparent 1px)',backgroundSize:'32px 32px'}} />
        <TreePine className="absolute -left-10 top-0 w-64 h-64 text-forest-700/30 pointer-events-none" />
        <TreePine className="absolute -right-10 bottom-0 w-48 h-48 text-forest-700/30 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6">
            <Sprout className="w-4 h-4 text-gold-300" />
            <span className="text-forest-200 text-xs font-medium">Resident Portal</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl text-white font-bold mb-4 text-balance">
            Are you a resident of <span className="text-gradient-gold">Aranya Hills Colony?</span>
          </h2>
          <p className="text-forest-300 text-base mb-8 max-w-lg mx-auto">Register your account to access plot information, connect with neighbours, and stay updated with colony news.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/register" className="btn-primary shine">Register Now <ArrowRight className="w-4 h-4" /></Link>
            <Link to="/login" className="btn-glass">Already a member? Login</Link>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-16 bg-mesh">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="inline-block bg-forest-100 text-forest-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">Quick Contacts</span>
            <h2 className="font-display text-3xl md:text-4xl text-forest-900 font-bold">{t('home.ourServices')}</h2>
            <p className="text-forest-500 mt-2 text-sm">Trusted service providers for colony maintenance</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {SERVICES.map(({ label, icon, color }, i) => (
              <Link key={label} to="/services" className={`group relative bg-card-premium rounded-2xl p-5 text-center card-hover overflow-hidden animate-fade-up delay-${(i+1)*100}`}>
                <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-2xl mx-auto mb-3 flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>{icon}</div>
                <p className="text-xs font-bold text-forest-800 group-hover:text-forest-600 transition-colors">{label}</p>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/services" className="inline-flex items-center gap-2 text-sm font-semibold text-forest-600 hover:text-forest-800 bg-forest-100 hover:bg-forest-200 px-5 py-2.5 rounded-xl transition-colors">
              View All Service Providers <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
