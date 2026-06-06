import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { Bell, Pin, Calendar } from 'lucide-react'

const PRIORITY_STYLES = {
  urgent: 'bg-red-100 text-red-700 border-red-200',
  general: 'bg-forest-100 text-forest-700 border-forest-200',
  event: 'bg-earth-100 text-earth-700 border-earth-200',
}

export default function Notices() {
  const { t, i18n } = useTranslation()
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const lang = i18n.language

  useEffect(() => {
    supabase
      .from('notices')
      .select('*')
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setNotices(data ?? [])
        setLoading(false)
      })
  }, [])

  const filtered = notices.filter(n => filter === 'all' || n.priority === filter)

  function getTitle(notice) {
    if (lang === 'te' && notice.title_te) return notice.title_te
    if (lang === 'hi' && notice.title_hi) return notice.title_hi
    return notice.title_en
  }

  function getContent(notice) {
    if (lang === 'te' && notice.content_te) return notice.content_te
    if (lang === 'hi' && notice.content_hi) return notice.content_hi
    return notice.content_en
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-forest-800">{t('notices.title')}</h1>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'urgent', 'general', 'event'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-forest-700 text-white'
                : 'bg-white border border-forest-200 text-forest-600 hover:bg-forest-50'
            }`}
          >
            {f === 'all' ? t('plots.filterAll') : t(`notices.${f}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-24 animate-pulse border border-forest-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="w-12 h-12 text-forest-300 mx-auto mb-3" />
          <p className="text-forest-400">{t('notices.noNotices')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(notice => (
            <div
              key={notice.id}
              className={`bg-white rounded-2xl border p-6 shadow-sm ${
                notice.is_pinned ? 'border-gold-400 shadow-gold-400/10' : 'border-forest-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  {notice.is_pinned && <Pin className="w-4 h-4 text-gold-500 mt-0.5 shrink-0" />}
                  <h2 className="font-display font-semibold text-forest-800 text-lg leading-snug">
                    {getTitle(notice)}
                  </h2>
                </div>
                <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full border font-medium ${PRIORITY_STYLES[notice.priority]}`}>
                  {t(`notices.${notice.priority}`)}
                </span>
              </div>

              <p className="text-forest-600 text-sm mt-3 leading-relaxed">{getContent(notice)}</p>

              <div className="flex items-center gap-4 mt-4 text-xs text-forest-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {t('notices.postedOn')}: {new Date(notice.created_at).toLocaleDateString('en-IN')}
                </span>
                {notice.expires_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {t('notices.expiresOn')}: {new Date(notice.expires_at).toLocaleDateString('en-IN')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
