import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { ArrowLeft, MapPin, Home, Users, Phone, ExternalLink, TreePine } from 'lucide-react'

const STATUS_STYLES = {
  occupied: 'bg-forest-100 text-forest-700',
  vacant: 'bg-earth-100 text-earth-700',
  under_construction: 'bg-yellow-100 text-yellow-700',
}

export default function PlotDetail() {
  const { id } = useParams()
  const { t } = useTranslation()
  const [plot, setPlot] = useState(null)
  const [family, setFamily] = useState([])
  const [resident, setResident] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('plots').select('*').eq('id', id).single(),
      supabase.from('family_members').select('*').eq('plot_id', id),
      supabase.from('profiles').select('full_name, phone, email, avatar_url').eq('plot_id', id).single(),
    ]).then(([{ data: plotData }, { data: familyData }, { data: residentData }]) => {
      setPlot(plotData)
      setFamily(familyData ?? [])
      setResident(residentData)
      setLoading(false)
    })
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="animate-pulse text-forest-500">{t('common.loading')}</div>
    </div>
  )

  if (!plot) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <p className="text-forest-500">Plot not found.</p>
      <Link to="/plots" className="text-forest-600 font-medium mt-4 inline-block hover:underline">
        ← Back to plots
      </Link>
    </div>
  )

  const mapsUrl = plot.latitude && plot.longitude
    ? `https://www.google.com/maps?q=${plot.latitude},${plot.longitude}`
    : `https://www.google.com/maps/search/Aranya+Hills+Colony+Badangpet+Hyderabad`

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      <Link to="/plots" className="inline-flex items-center gap-2 text-forest-600 hover:text-forest-800 mb-6 text-sm font-medium">
        <ArrowLeft className="w-4 h-4" />
        {t('common.back')} to Plots
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Left: Photo + Map */}
        <div className="space-y-4">
          {/* House Photo */}
          <div className="rounded-2xl overflow-hidden h-64 bg-gradient-to-br from-forest-100 to-forest-200">
            {plot.house_photo_url ? (
              <img src={plot.house_photo_url} alt={plot.plot_number} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                {plot.status === 'occupied'
                  ? <Home className="w-20 h-20 text-forest-300" />
                  : <TreePine className="w-20 h-20 text-forest-200" />
                }
                <p className="text-forest-400 text-sm">No photo uploaded</p>
              </div>
            )}
          </div>

          {/* Google Maps */}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white border border-forest-200 rounded-xl px-4 py-3 text-sm font-medium text-forest-700 hover:bg-forest-50 transition-colors"
          >
            <MapPin className="w-4 h-4 text-forest-500" />
            {t('plots.viewOnMap')}
            <ExternalLink className="w-3.5 h-3.5 ml-auto text-forest-400" />
          </a>
        </div>

        {/* Right: Details */}
        <div className="space-y-6">

          {/* Plot Info */}
          <div className="bg-white rounded-2xl border border-forest-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="font-display text-2xl font-bold text-forest-800">{plot.plot_number}</h1>
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_STYLES[plot.status]}`}>
                {t(`plots.${plot.status}`)}
              </span>
            </div>

            <div className="space-y-2 text-sm text-forest-600">
              {plot.area_sqyards && (
                <div className="flex justify-between">
                  <span className="text-forest-400">{t('plots.area')}</span>
                  <span className="font-medium">{plot.area_sqyards} {t('plots.sqYards')}</span>
                </div>
              )}
              {plot.address_line && (
                <div className="flex justify-between gap-4">
                  <span className="text-forest-400 shrink-0">Address</span>
                  <span className="font-medium text-right">{plot.address_line}</span>
                </div>
              )}
            </div>
          </div>

          {/* Resident Info */}
          {resident && (
            <div className="bg-white rounded-2xl border border-forest-100 p-6">
              <h2 className="font-display text-lg font-semibold text-forest-800 mb-4 flex items-center gap-2">
                <Home className="w-5 h-5 text-forest-500" />
                Owner / Resident
              </h2>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-forest-100 overflow-hidden shrink-0">
                  {resident.avatar_url
                    ? <img src={resident.avatar_url} alt={resident.full_name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-forest-500 font-display font-bold text-xl">
                        {resident.full_name?.[0]}
                      </div>
                  }
                </div>
                <div>
                  <p className="font-semibold text-forest-800">{resident.full_name}</p>
                  {resident.phone && (
                    <a href={`tel:${resident.phone}`}
                      className="text-sm text-forest-500 hover:text-forest-700 flex items-center gap-1 mt-1">
                      <Phone className="w-3.5 h-3.5" />
                      {resident.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Family Members */}
          {family.length > 0 && (
            <div className="bg-white rounded-2xl border border-forest-100 p-6">
              <h2 className="font-display text-lg font-semibold text-forest-800 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-forest-500" />
                {t('plots.familyMembers')} ({family.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {family.map(member => (
                  <div key={member.id} className="flex items-center gap-3 bg-forest-50 rounded-xl p-3">
                    <div className="w-10 h-10 rounded-full bg-forest-200 overflow-hidden shrink-0">
                      {member.photo_url
                        ? <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-forest-500 font-bold text-sm">
                            {member.name?.[0]}
                          </div>
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-forest-800 text-sm truncate">{member.name}</p>
                      {member.relation && (
                        <p className="text-xs text-forest-500">{member.relation}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {plot.status === 'vacant' && (
            <div className="bg-earth-50 border border-earth-200 rounded-2xl p-6 text-center">
              <TreePine className="w-10 h-10 text-earth-400 mx-auto mb-2" />
              <p className="text-earth-700 font-medium">This plot is vacant</p>
              <p className="text-earth-500 text-sm mt-1">No residents are currently registered here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
