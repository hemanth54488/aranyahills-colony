import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { Home, Search, MapPin, Users, ChevronRight, TreePine } from 'lucide-react'

const STATUS_STYLES = {
  occupied: 'bg-forest-100 text-forest-700 border-forest-200',
  vacant: 'bg-earth-100 text-earth-700 border-earth-200',
  under_construction: 'bg-yellow-100 text-yellow-700 border-yellow-200',
}

export default function Plots() {
  const { t } = useTranslation()
  const [plots, setPlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    supabase
      .from('plots')
      .select('*, profiles(full_name, phone), family_members(id)')
      .order('plot_number')
      .then(({ data }) => {
        setPlots(data ?? [])
        setLoading(false)
      })
  }, [])

  const filtered = plots.filter(p => {
    const matchesFilter = filter === 'all' || p.status === filter
    const q = search.toLowerCase()
    const matchesSearch = !q
      || p.plot_number.toLowerCase().includes(q)
      || p.profiles?.full_name?.toLowerCase().includes(q)
    return matchesFilter && matchesSearch
  })

  const FILTERS = [
    { key: 'all', label: t('plots.filterAll') },
    { key: 'occupied', label: t('plots.filterOccupied') },
    { key: 'vacant', label: t('plots.filterVacant') },
    { key: 'under_construction', label: t('plots.filterConstruction') },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-forest-800">
          {t('plots.title')}
        </h1>
        <p className="text-forest-500 mt-2">{t('plots.subtitle')}</p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('plots.search')}
            className="w-full pl-10 pr-4 py-2.5 border border-forest-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === f.key
                  ? 'bg-forest-700 text-white'
                  : 'bg-white border border-forest-200 text-forest-600 hover:bg-forest-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-40 animate-pulse border border-forest-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-forest-400">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>{t('common.noData')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(plot => (
            <Link
              key={plot.id}
              to={`/plots/${plot.id}`}
              className="bg-white rounded-xl border border-forest-100 overflow-hidden hover:shadow-md hover:border-forest-300 transition-all group"
            >
              {/* House photo / placeholder */}
              <div className="h-36 bg-gradient-to-br from-forest-50 to-forest-100 relative overflow-hidden">
                {plot.house_photo_url ? (
                  <img src={plot.house_photo_url} alt={plot.plot_number} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    {plot.status === 'occupied'
                      ? <Home className="w-12 h-12 text-forest-300" />
                      : <TreePine className="w-12 h-12 text-forest-200" />
                    }
                  </div>
                )}
                <div className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[plot.status]}`}>
                  {t(`plots.${plot.status}`)}
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-forest-800 text-base">
                    {plot.plot_number}
                  </span>
                  <ChevronRight className="w-4 h-4 text-forest-400 group-hover:text-forest-600 transition-colors" />
                </div>

                {plot.profiles ? (
                  <div className="mt-1.5 space-y-1">
                    <p className="text-sm font-medium text-forest-700 truncate">{plot.profiles.full_name}</p>
                    <p className="text-xs text-forest-400 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {plot.family_members?.length ?? 0} family members
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-forest-400 mt-1.5">{t('plots.noResidents')}</p>
                )}

                {plot.area_sqyards && (
                  <p className="text-xs text-forest-400 mt-1">
                    {plot.area_sqyards} {t('plots.sqYards')}
                  </p>
                )}

                {(plot.latitude && plot.longitude) && (
                  <p className="text-xs text-forest-400 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-forest-300" />
                    {t('plots.viewOnMap')}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="mt-8 text-sm text-forest-400 text-center">
        Showing {filtered.length} of {plots.length} plots
      </div>
    </div>
  )
}
