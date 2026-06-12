import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { CalendarDays, MapPin, Clock } from 'lucide-react'

export default function Events() {
  const { t } = useTranslation()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('upcoming')

  useEffect(() => {
    supabase.from('events').select('*').order('event_date', { ascending: tab === 'upcoming' })
      .then(({ data }) => { setEvents(data ?? []); setLoading(false) })
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const upcoming = events.filter(e => e.event_date >= today)
  const past = events.filter(e => e.event_date < today)
  const displayed = tab === 'upcoming' ? upcoming : past.reverse()

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-forest-800">{t('events.title')}</h1>
      </div>

      <div className="flex gap-1 bg-forest-50 p-1 rounded-xl mb-6 border border-forest-100">
        {[['upcoming', t('events.upcoming')], ['past', t('events.past')]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tab === k ? 'bg-white text-forest-800 shadow-sm' : 'text-forest-500 hover:text-forest-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_,i) => <div key={i} className="h-28 bg-forest-50 rounded-2xl animate-pulse" />)}</div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-14 text-forest-400">
          <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">{t('events.noEvents')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map(e => {
            const d = new Date(e.event_date)
            return (
              <div key={e.id} className="bg-white border border-forest-100 rounded-2xl overflow-hidden flex">
                {/* Date badge */}
                <div className="w-20 shrink-0 bg-gradient-to-b from-forest-700 to-forest-800 flex flex-col items-center justify-center text-white p-3">
                  <span className="text-xs font-semibold opacity-80">{MONTH_NAMES[d.getMonth()]}</span>
                  <span className="text-3xl font-display font-bold leading-none">{d.getDate()}</span>
                  <span className="text-xs opacity-70">{d.getFullYear()}</span>
                </div>
                {/* Content */}
                <div className="flex-1 p-4">
                  {e.image_url && (
                    <div className="h-28 rounded-xl overflow-hidden mb-3">
                      <img src={e.image_url} alt={e.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <h3 className="font-display font-bold text-forest-800 text-base">{e.title}</h3>
                  {e.description && <p className="text-sm text-forest-600 mt-1 line-clamp-2">{e.description}</p>}
                  <div className="flex flex-wrap gap-3 mt-2">
                    {(e.start_time || e.end_time) && (
                      <span className="flex items-center gap-1 text-xs text-forest-400">
                        <Clock className="w-3.5 h-3.5" />
                        {e.start_time}{e.end_time ? ` – ${e.end_time}` : ''}
                      </span>
                    )}
                    {e.location && (
                      <span className="flex items-center gap-1 text-xs text-forest-400">
                        <MapPin className="w-3.5 h-3.5" />{e.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
