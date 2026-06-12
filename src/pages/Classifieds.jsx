import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import notify from '../lib/notify'
import { Tag, Plus, X, Phone, AlertCircle } from 'lucide-react'

const TYPES = ['sell','buy','rent','service','lost_found']
const TYPE_COLORS = {
  sell: 'bg-forest-100 text-forest-700',
  buy: 'bg-blue-100 text-blue-700',
  rent: 'bg-purple-100 text-purple-700',
  service: 'bg-amber-100 text-amber-700',
  lost_found: 'bg-red-100 text-red-700',
}

const RULES = {
  title: v => {
    if (!v?.trim()) return 'Title is required'
    if (v.trim().length < 3) return 'Title too short'
    if (v.trim().length > 100) return 'Title too long'
    return ''
  },
  contact_phone: v => {
    if (!v?.trim()) return ''
    const d = v.replace(/\D/g, '')
    if (d.length !== 10) return '10-digit number required'
    if (!/^[6-9]/.test(d)) return 'Must start with 6-9'
    return ''
  },
  price: v => {
    if (!v) return ''
    const n = Number(v)
    if (isNaN(n) || n < 0) return 'Enter a valid price'
    return ''
  },
}

function inputClass(touched, error) {
  const base = 'w-full px-3.5 py-2.5 border-2 rounded-xl text-sm focus:outline-none transition-all bg-white'
  if (!touched) return `${base} border-gray-200 focus:border-forest-400 focus:ring-4 focus:ring-forest-100`
  if (error) return `${base} border-red-400 bg-red-50/30 focus:border-red-400 focus:ring-4 focus:ring-red-100`
  return `${base} border-forest-400 bg-forest-50/30 focus:border-forest-500 focus:ring-4 focus:ring-forest-100`
}

function FieldMsg({ touched, error }) {
  if (!touched || !error) return null
  return (
    <p className="flex items-center gap-1 mt-1 text-xs text-red-600 font-medium">
      <AlertCircle className="w-3 h-3 shrink-0" />{error}
    </p>
  )
}

export default function Classifieds() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', type: 'sell', price: '', contact_phone: '', image_url: '' })
  const [touched, setTouched] = useState({})
  const [submitting, setSubmitting] = useState(false)

  function fetchAds() {
    supabase.from('classifieds').select('*, profiles(full_name), plots(plot_number)').eq('is_active', true).order('created_at', { ascending: false })
      .then(({ data }) => { setAds(data ?? []); setLoading(false) })
  }
  useEffect(() => { fetchAds() }, [])

  const errors = {
    title: RULES.title(form.title),
    contact_phone: RULES.contact_phone(form.contact_phone),
    price: RULES.price(form.price),
  }
  const formValid = !errors.title && !errors.contact_phone && !errors.price

  async function postAd() {
    setTouched({ title: true, contact_phone: true, price: true })
    if (!formValid) return
    setSubmitting(true)
    const { error } = await supabase.from('classifieds').insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      type: form.type,
      price: form.price ? Number(form.price) : null,
      contact_phone: form.contact_phone.trim() || null,
      image_url: form.image_url.trim() || null,
      plot_id: profile.plot_id,
      created_by: profile.id,
    })
    setSubmitting(false)
    if (error) { notify.error('Post failed', error.message); return }
    notify.success('Ad posted successfully')
    setShowModal(false)
    setForm({ title: '', description: '', type: 'sell', price: '', contact_phone: '', image_url: '' })
    setTouched({})
    fetchAds()
  }

  async function markInactive(id) {
    if (!window.confirm('Mark this ad as done/sold?')) return
    await supabase.from('classifieds').update({ is_active: false }).eq('id', id)
    setAds(a => a.filter(x => x.id !== id))
    notify.success('Ad closed')
  }

  const filtered = filterType === 'all' ? ads : ads.filter(a => a.type === filterType)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-bold text-forest-800">{t('classifieds.title')}</h1>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold text-sm rounded-xl transition-colors">
          <Plus className="w-4 h-4" />{t('classifieds.post')}
        </button>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterType === 'all' ? 'bg-forest-700 text-white' : 'bg-white border border-forest-200 text-forest-600 hover:bg-forest-50'}`}>
          {t('classifieds.all')}
        </button>
        {TYPES.map(type => (
          <button key={type} onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterType === type ? 'bg-forest-700 text-white' : 'bg-white border border-forest-200 text-forest-600 hover:bg-forest-50'}`}>
            {t(`classifieds.${type}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_,i) => <div key={i} className="h-40 bg-forest-50 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14 text-forest-400">
          <Tag className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">{t('classifieds.noAds')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(ad => (
            <div key={ad.id} className="bg-white border border-forest-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              {ad.image_url && (
                <div className="h-36 overflow-hidden bg-forest-50">
                  <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${TYPE_COLORS[ad.type]}`}>
                    {t(`classifieds.${ad.type}`)}
                  </span>
                  {ad.price && <span className="text-forest-700 font-bold text-sm">₹{Number(ad.price).toLocaleString('en-IN')}</span>}
                </div>
                <h3 className="font-semibold text-forest-800 text-sm mb-1">{ad.title}</h3>
                {ad.description && <p className="text-xs text-forest-500 line-clamp-2">{ad.description}</p>}
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-forest-500">{ad.profiles?.full_name}{ad.plots?.plot_number ? ` · ${ad.plots.plot_number}` : ''}</p>
                    <p className="text-xs text-forest-400">{new Date(ad.created_at).toLocaleDateString('en-IN')}</p>
                  </div>
                  {ad.contact_phone && (
                    <a href={`tel:${ad.contact_phone}`}
                      className="flex items-center gap-1 px-3 py-1.5 bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold rounded-lg transition-colors">
                      <Phone className="w-3 h-3" />Call
                    </a>
                  )}
                </div>
                {ad.created_by === profile.id && (
                  <button onClick={() => markInactive(ad.id)}
                    className="mt-2 w-full text-xs text-red-500 hover:text-red-700 font-medium transition-colors text-center">
                    {t('classifieds.markInactive')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-forest-100 sticky top-0 bg-white">
              <h2 className="font-display font-bold text-forest-800 text-lg">{t('classifieds.post')}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-forest-400 hover:bg-forest-50"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-2">Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {TYPES.map(type => (
                    <button key={type} type="button" onClick={() => setForm(f => ({ ...f, type }))}
                      className={`py-2 rounded-lg text-xs font-semibold border-2 transition-all ${form.type === type ? 'border-forest-600 bg-forest-50 text-forest-800' : 'border-gray-200 text-forest-600 hover:border-forest-300'}`}>
                      {t(`classifieds.${type}`)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} onBlur={() => setTouched(p => ({ ...p, title: true }))}
                  placeholder="Brief title" className={inputClass(touched.title, errors.title)} />
                <FieldMsg touched={touched.title} error={errors.title} />
              </div>
              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className={`${inputClass(false, '')} resize-none`} placeholder="Additional details" />
              </div>
              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">{t('classifieds.price')}</label>
                <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} onBlur={() => setTouched(p => ({ ...p, price: true }))}
                  placeholder="0" min={0} className={inputClass(touched.price, errors.price)} />
                <FieldMsg touched={touched.price} error={errors.price} />
              </div>
              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">{t('classifieds.contact')}</label>
                <input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} onBlur={() => setTouched(p => ({ ...p, contact_phone: true }))}
                  placeholder="10-digit mobile number" maxLength={10} className={inputClass(touched.contact_phone, errors.contact_phone)} />
                <FieldMsg touched={touched.contact_phone} error={errors.contact_phone} />
              </div>
              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">Image URL</label>
                <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." className={inputClass(false, '')} />
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={postAd} disabled={submitting}
                className="flex-1 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold rounded-xl disabled:opacity-60 transition-colors text-sm">
                {submitting ? 'Posting...' : t('classifieds.post')}
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-forest-200 text-forest-600 rounded-xl hover:bg-forest-50 transition-colors text-sm">{t('common.cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
