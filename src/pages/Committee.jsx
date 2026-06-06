import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { Users, Phone, Mail, Award, ChevronDown, ChevronUp } from 'lucide-react'

const ROLE_ORDER = ['president','vice_president','general_secretary','joint_secretary','treasurer','executive_member']

const ROLE_COLORS = {
  president: 'bg-gold-400 text-forest-900',
  vice_president: 'bg-forest-600 text-white',
  general_secretary: 'bg-forest-700 text-white',
  joint_secretary: 'bg-earth-500 text-white',
  treasurer: 'bg-forest-500 text-white',
  executive_member: 'bg-forest-300 text-forest-800',
}

function MemberCard({ member }) {
  const { t } = useTranslation()
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-forest-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* Photo */}
      <div className="h-48 bg-gradient-to-br from-forest-100 to-forest-200 flex items-center justify-center relative">
        {member.photo_url ? (
          <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-forest-300 flex items-center justify-center">
            <span className="font-display text-4xl font-bold text-forest-600">
              {member.full_name?.[0]?.toUpperCase()}
            </span>
          </div>
        )}
        {/* Role badge */}
        <div className={`absolute top-3 right-3 text-xs font-semibold px-3 py-1 rounded-full ${ROLE_COLORS[member.role]}`}>
          {t(`committee.${member.role}`)}
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-display text-lg font-bold text-forest-800">{member.full_name}</h3>
        <p className="text-forest-500 text-sm mt-1 flex items-center gap-1">
          <Award className="w-3.5 h-3.5 text-gold-500" />
          {t('committee.tenure')}: {member.year}
        </p>

        <div className="mt-4 space-y-2">
          {member.phone && (
            <a
              href={`tel:${member.phone}`}
              className="flex items-center gap-2 text-sm text-forest-600 hover:text-forest-800 transition-colors"
            >
              <Phone className="w-4 h-4 text-forest-400" />
              {member.phone}
            </a>
          )}
          {member.email && (
            <a
              href={`mailto:${member.email}`}
              className="flex items-center gap-2 text-sm text-forest-600 hover:text-forest-800 transition-colors"
            >
              <Mail className="w-4 h-4 text-forest-400" />
              {member.email}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Committee() {
  const { t } = useTranslation()
  const [members, setMembers] = useState([])
  const [pastYears, setPastYears] = useState([])
  const [selectedYear, setSelectedYear] = useState(null)
  const [pastMembers, setPastMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('committee_members')
      .select('*')
      .eq('is_active', true)
      .then(({ data }) => {
        const sorted = (data ?? []).sort((a, b) =>
          ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role)
        )
        setMembers(sorted)
        setLoading(false)
      })

    supabase
      .from('committee_members')
      .select('year')
      .eq('is_active', false)
      .then(({ data }) => {
        const years = [...new Set((data ?? []).map(m => m.year))].sort((a, b) => b - a)
        setPastYears(years)
      })
  }, [])

  async function loadPastYear(year) {
    if (selectedYear === year) { setSelectedYear(null); setPastMembers([]); return }
    const { data } = await supabase
      .from('committee_members')
      .select('*')
      .eq('year', year)
      .eq('is_active', false)
    const sorted = (data ?? []).sort((a, b) =>
      ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role)
    )
    setPastMembers(sorted)
    setSelectedYear(year)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-forest-100 text-forest-700 text-xs font-medium px-3 py-1.5 rounded-full mb-3">
          <Users className="w-3.5 h-3.5" />
          {t('committee.currentYear')}
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-forest-800">
          {t('committee.title')}
        </h1>
        <p className="text-forest-500 mt-2">{t('committee.subtitle')}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-64 animate-pulse border border-forest-100" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-20 text-forest-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Committee members will appear here once the admin adds them.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map(m => <MemberCard key={m.id} member={m} />)}
        </div>
      )}

      {/* Past Committees */}
      {pastYears.length > 0 && (
        <div className="mt-16">
          <h2 className="font-display text-2xl font-bold text-forest-800 mb-6">
            {t('committee.pastCommittees')}
          </h2>
          <div className="space-y-3">
            {pastYears.map(year => (
              <div key={year} className="bg-white border border-forest-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => loadPastYear(year)}
                  className="w-full flex items-center justify-between px-6 py-4 text-forest-700 hover:bg-forest-50 transition-colors"
                >
                  <span className="font-medium">{t('committee.tenure')} {year}</span>
                  {selectedYear === year
                    ? <ChevronUp className="w-4 h-4" />
                    : <ChevronDown className="w-4 h-4" />
                  }
                </button>
                {selectedYear === year && (
                  <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pastMembers.map(m => <MemberCard key={m.id} member={m} />)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
