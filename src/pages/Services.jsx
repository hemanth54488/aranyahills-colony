import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { Phone, Plus, Wrench, Zap, Hammer, Paintbrush, Bug, MoreHorizontal, CheckCircle, XCircle } from 'lucide-react'

const CATEGORY_ICONS = {
  plumber: Wrench,
  electrician: Zap,
  carpenter: Hammer,
  painter: Paintbrush,
  pest_control: Bug,
  other: MoreHorizontal,
}

const CATEGORY_COLORS = {
  plumber: 'bg-blue-100 text-blue-700',
  electrician: 'bg-yellow-100 text-yellow-700',
  carpenter: 'bg-earth-100 text-earth-700',
  painter: 'bg-purple-100 text-purple-700',
  pest_control: 'bg-orange-100 text-orange-700',
  other: 'bg-gray-100 text-gray-700',
}

function AddProviderModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', category: 'plumber', phone: '', alternate_phone: '', address: '' })
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('service_providers').insert({
      ...form,
      added_by: user.id,
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Provider added!')
    onAdd()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="p-6 border-b border-forest-100">
          <h2 className="font-display text-xl font-bold text-forest-800">Add Service Provider</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <input required placeholder="Provider Name" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-2.5 border border-forest-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
          />
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
            className="w-full px-4 py-2.5 border border-forest-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-400 bg-white">
            {Object.keys(CATEGORY_ICONS).map(cat => (
              <option key={cat} value={cat}>{cat.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
            ))}
          </select>
          <input required placeholder="Phone Number" value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            className="w-full px-4 py-2.5 border border-forest-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
          />
          <input placeholder="Alternate Phone (optional)" value={form.alternate_phone}
            onChange={e => setForm({ ...form, alternate_phone: e.target.value })}
            className="w-full px-4 py-2.5 border border-forest-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
          />
          <input placeholder="Address / Area" value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })}
            className="w-full px-4 py-2.5 border border-forest-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
          />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-forest-200 rounded-xl text-sm font-medium text-forest-600 hover:bg-forest-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-forest-700 text-white rounded-xl text-sm font-medium hover:bg-forest-800 disabled:opacity-60">
              {loading ? 'Saving...' : 'Add Provider'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Services() {
  const { t } = useTranslation()
  const { isAdmin } = useAuth()
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [filterCat, setFilterCat] = useState('all')

  async function loadProviders() {
    const { data } = await supabase.from('service_providers').select('*').order('category').order('name')
    setProviders(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadProviders() }, [])

  const filtered = filterCat === 'all' ? providers : providers.filter(p => p.category === filterCat)

  const grouped = filtered.reduce((acc, p) => {
    acc[p.category] = acc[p.category] ?? []
    acc[p.category].push(p)
    return acc
  }, {})

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-forest-800">{t('services.title')}</h1>
          <p className="text-forest-500 mt-1 text-sm">{t('services.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-forest-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-forest-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('services.addProvider')}
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {['all', ...Object.keys(CATEGORY_ICONS)].map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              filterCat === cat ? 'bg-forest-700 text-white' : 'bg-white border border-forest-200 text-forest-600 hover:bg-forest-50'
            }`}
          >
            {cat === 'all' ? 'All' : cat.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-36 animate-pulse border border-forest-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-forest-400">
          <Phone className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>{t('services.noProviders')}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, items]) => {
            const Icon = CATEGORY_ICONS[category] ?? MoreHorizontal
            return (
              <div key={category}>
                <h2 className="font-display text-lg font-semibold text-forest-700 mb-3 flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  {t(`services.${category}`)}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map(provider => (
                    <div key={provider.id} className="bg-white rounded-xl border border-forest-100 p-5 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-forest-800">{provider.name}</h3>
                          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[provider.category]}`}>
                            {t(`services.${provider.category}`)}
                          </span>
                        </div>
                        {provider.is_available
                          ? <CheckCircle className="w-5 h-5 text-forest-500 shrink-0" />
                          : <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                        }
                      </div>
                      {provider.address && (
                        <p className="text-xs text-forest-400 mb-3">{provider.address}</p>
                      )}
                      <div className="space-y-1.5">
                        <a href={`tel:${provider.phone}`}
                          className="flex items-center gap-2 bg-forest-600 hover:bg-forest-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors w-full justify-center">
                          <Phone className="w-3.5 h-3.5" />
                          {t('services.callNow')}: {provider.phone}
                        </a>
                        {provider.alternate_phone && (
                          <a href={`tel:${provider.alternate_phone}`}
                            className="flex items-center gap-2 text-forest-600 border border-forest-200 text-xs px-4 py-1.5 rounded-lg text-center w-full justify-center hover:bg-forest-50">
                            Alt: {provider.alternate_phone}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showAdd && <AddProviderModal onClose={() => setShowAdd(false)} onAdd={loadProviders} />}
    </div>
  )
}
