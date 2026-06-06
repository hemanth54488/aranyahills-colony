import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { Home, ArrowLeft, Save, X } from 'lucide-react'
import { Link } from 'react-router-dom'

const STATUSES = ['vacant', 'occupied', 'under_construction']

const STATUS_LABELS = {
  vacant: 'Vacant',
  occupied: 'Occupied',
  under_construction: 'Under Construction',
}

const STATUS_COLORS = {
  occupied: 'bg-forest-100 text-forest-700',
  vacant: 'bg-earth-100 text-earth-700',
  under_construction: 'bg-yellow-100 text-yellow-700',
}

export default function ManagePlots() {
  const { t } = useTranslation()
  const [plots, setPlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})

  async function load() {
    const { data } = await supabase
      .from('plots')
      .select('*')
      .order('plot_number')
    setPlots(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function startEdit(plot) {
    setEditingId(plot.id)
    setEditForm({
      plot_number: plot.plot_number,
      area_sqyards: plot.area_sqyards ?? '',
      status: plot.status,
      address_line: plot.address_line ?? '',
      latitude: plot.latitude ?? '',
      longitude: plot.longitude ?? '',
      house_photo_url: plot.house_photo_url ?? '',
    })
  }

  async function saveEdit(id) {
    const { error } = await supabase.from('plots').update({
      ...editForm,
      area_sqyards: editForm.area_sqyards ? parseFloat(editForm.area_sqyards) : null,
      latitude: editForm.latitude ? parseFloat(editForm.latitude) : null,
      longitude: editForm.longitude ? parseFloat(editForm.longitude) : null,
    }).eq('id', id)

    if (error) { toast.error(error.message); return }
    toast.success('Plot updated!')
    setEditingId(null)
    load()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      <Link to="/admin" className="inline-flex items-center gap-2 text-forest-600 hover:text-forest-800 mb-6 text-sm font-medium">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-forest-800">{t('admin.managePlots')}</h1>
        <p className="text-forest-500 mt-1 text-sm">Update plot details, status, coordinates, and photos</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-16 animate-pulse border border-forest-100" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {plots.map(plot => (
            <div key={plot.id} className="bg-white rounded-xl border border-forest-100 overflow-hidden">
              {editingId === plot.id ? (
                /* Edit Form */
                <div className="p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="text-xs text-forest-500 font-medium mb-1 block">Plot Number</label>
                      <input value={editForm.plot_number}
                        onChange={e => setEditForm({ ...editForm, plot_number: e.target.value })}
                        className="w-full px-3 py-2 border border-forest-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-400" />
                    </div>
                    <div>
                      <label className="text-xs text-forest-500 font-medium mb-1 block">Status</label>
                      <select value={editForm.status}
                        onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                        className="w-full px-3 py-2 border border-forest-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-400 bg-white">
                        {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-forest-500 font-medium mb-1 block">Area (Sq. Yards)</label>
                      <input type="number" value={editForm.area_sqyards}
                        onChange={e => setEditForm({ ...editForm, area_sqyards: e.target.value })}
                        className="w-full px-3 py-2 border border-forest-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
                        placeholder="e.g. 200" />
                    </div>
                    <div>
                      <label className="text-xs text-forest-500 font-medium mb-1 block">Address</label>
                      <input value={editForm.address_line}
                        onChange={e => setEditForm({ ...editForm, address_line: e.target.value })}
                        className="w-full px-3 py-2 border border-forest-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
                        placeholder="e.g. Plot-5, Street 2, Aranya Hills" />
                    </div>
                    <div>
                      <label className="text-xs text-forest-500 font-medium mb-1 block">Latitude (Google Maps)</label>
                      <input type="number" step="any" value={editForm.latitude}
                        onChange={e => setEditForm({ ...editForm, latitude: e.target.value })}
                        className="w-full px-3 py-2 border border-forest-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
                        placeholder="e.g. 17.3265" />
                    </div>
                    <div>
                      <label className="text-xs text-forest-500 font-medium mb-1 block">Longitude (Google Maps)</label>
                      <input type="number" step="any" value={editForm.longitude}
                        onChange={e => setEditForm({ ...editForm, longitude: e.target.value })}
                        className="w-full px-3 py-2 border border-forest-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
                        placeholder="e.g. 78.5312" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-forest-500 font-medium mb-1 block">House Photo URL (from Cloudinary)</label>
                      <input value={editForm.house_photo_url}
                        onChange={e => setEditForm({ ...editForm, house_photo_url: e.target.value })}
                        className="w-full px-3 py-2 border border-forest-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
                        placeholder="https://res.cloudinary.com/..." />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => saveEdit(plot.id)}
                      className="flex items-center gap-2 bg-forest-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-forest-800">
                      <Save className="w-3.5 h-3.5" />
                      Save
                    </button>
                    <button onClick={() => setEditingId(null)}
                      className="flex items-center gap-2 border border-forest-200 text-forest-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-forest-50">
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* View Row */
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 bg-forest-100 rounded-lg flex items-center justify-center shrink-0">
                      <Home className="w-5 h-5 text-forest-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-forest-800">{plot.plot_number}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[plot.status]}`}>
                          {STATUS_LABELS[plot.status]}
                        </span>
                        {plot.area_sqyards && (
                          <span className="text-xs text-forest-400">{plot.area_sqyards} sq.yd</span>
                        )}
                      </div>
                      {plot.address_line && (
                        <p className="text-xs text-forest-400 truncate mt-0.5">{plot.address_line}</p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => startEdit(plot)}
                    className="text-xs px-3 py-1.5 border border-forest-200 text-forest-600 rounded-lg hover:bg-forest-50 transition-colors font-medium shrink-0">
                    Edit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
