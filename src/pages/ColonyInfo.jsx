import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { Building2, CreditCard, FileText, Download, MapPin, Lock } from 'lucide-react'

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-forest-100 last:border-0">
      <span className="text-forest-500 text-sm">{label}</span>
      <span className="text-forest-800 font-medium text-sm">{value ?? '—'}</span>
    </div>
  )
}

export default function ColonyInfo() {
  const { t, i18n } = useTranslation()
  const [info, setInfo] = useState(null)
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('colony_info').select('*').single(),
      supabase.from('documents').select('*').order('category').order('created_at', { ascending: false }),
    ]).then(([{ data: infoData }, { data: docsData }]) => {
      setInfo(infoData)
      setDocs(docsData ?? [])
      setLoading(false)
    })
  }, [])

  const lang = i18n.language

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-forest-500 animate-pulse">
      {t('common.loading')}
    </div>
  )

  const categoryIcons = { bylaws: '📜', meeting_minutes: '📋', financial: '💰', legal: '⚖️', other: '📁' }
  const docsByCategory = docs.reduce((acc, doc) => {
    acc[doc.category] = acc[doc.category] ?? []
    acc[doc.category].push(doc)
    return acc
  }, {})

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-forest-800">{t('colonyInfo.title')}</h1>
        <p className="text-forest-500 mt-2 flex items-center gap-1.5 text-sm">
          <Lock className="w-4 h-4" />
          {t('colonyInfo.restricted')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* About */}
        {info && (
          <div className="md:col-span-2 bg-gradient-to-r from-forest-700 to-forest-600 text-white rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <MapPin className="w-5 h-5 text-gold-400" />
              <h2 className="font-display text-lg font-semibold">{t('colonyInfo.registeredAddress')}</h2>
            </div>
            <p className="text-forest-100">{info.registered_address}</p>
            {info.about_en && (
              <p className="text-forest-200 text-sm mt-3 leading-relaxed">
                {lang === 'te' && info.about_te ? info.about_te
                  : lang === 'hi' && info.about_hi ? info.about_hi
                  : info.about_en}
              </p>
            )}
            <div className="mt-4 flex gap-6 text-sm">
              <div>
                <div className="text-gold-300 text-xs">{t('colonyInfo.foundedYear')}</div>
                <div className="font-bold text-white">{info.founded_year ?? '—'}</div>
              </div>
              <div>
                <div className="text-gold-300 text-xs">Total Plots</div>
                <div className="font-bold text-white">{info.total_plots}</div>
              </div>
            </div>
          </div>
        )}

        {/* Bank Details */}
        <div className="bg-white rounded-2xl border border-forest-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-forest-600" />
            <h2 className="font-display text-lg font-semibold text-forest-800">
              {t('colonyInfo.bankDetails')}
            </h2>
          </div>
          {info ? (
            <div>
              <InfoRow label={t('colonyInfo.bankName')} value={info.bank_name} />
              <InfoRow label={t('colonyInfo.accountNo')} value={info.account_number} />
              <InfoRow label={t('colonyInfo.ifscCode')} value={info.ifsc_code} />
            </div>
          ) : <p className="text-forest-400 text-sm">No bank details added yet.</p>}
        </div>

        {/* PAN Card */}
        <div className="bg-white rounded-2xl border border-forest-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-forest-600" />
            <h2 className="font-display text-lg font-semibold text-forest-800">{t('colonyInfo.panCard')}</h2>
          </div>
          {info ? (
            <InfoRow label={t('colonyInfo.panNumber')} value={info.pan_number} />
          ) : <p className="text-forest-400 text-sm">No PAN card details added yet.</p>}
        </div>

        {/* Documents */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-forest-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <FileText className="w-5 h-5 text-forest-600" />
            <h2 className="font-display text-lg font-semibold text-forest-800">{t('colonyInfo.bylaws')}</h2>
          </div>

          {docs.length === 0 ? (
            <p className="text-forest-400 text-sm">No documents uploaded yet.</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(docsByCategory).map(([category, categoryDocs]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-forest-600 uppercase tracking-wide mb-3">
                    {categoryIcons[category]} {category.replace('_', ' ')}
                  </h3>
                  <div className="space-y-2">
                    {categoryDocs.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between bg-forest-50 rounded-xl px-4 py-3">
                        <span className="text-sm font-medium text-forest-700">{doc.name}</span>
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-medium text-forest-600 hover:text-forest-800 bg-white border border-forest-200 rounded-lg px-3 py-1.5 hover:bg-forest-50 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {t('colonyInfo.download')}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
