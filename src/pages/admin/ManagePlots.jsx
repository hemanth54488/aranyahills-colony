import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import notify from '../../lib/notify'
import { Home, ArrowLeft, Save, X, AlertCircle, CheckCircle, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'

const STATUSES = ['vacant', 'occupied', 'under_construction']
const STATUS_LABELS  = { vacant: 'Vacant', occupied: 'Occupied', under_construction: 'Under Construction' }
const STATUS_COLORS  = { occupied: 'bg-forest-100 text-forest-700', vacant: 'bg-earth-100 text-earth-700', under_construction: 'bg-yellow-100 text-yellow-700' }

// ── Validation rules ─────────────────────────────────
const RULES = {
  plot_number: v => {
    if (!v.trim()) return 'Plot number is required'
    if (v.trim().length < 2) return 'Plot number is too short'
    return ''
  },
  area_sqyards: v => {
    if (!v && v !== 0) return ''
    const n = parseFloat(v)
    if (isNaN(n)) return 'Enter a valid number'
    if (n <= 0) return 'Area must be greater than 0'
    if (n > 10000) return 'Area seems too large — please verify'
    return ''
  },
  latitude: v => {
    if (v === '' || v === null || v === undefined) return ''
    const n = parseFloat(v)
    if (isNaN(n)) return 'Enter a valid latitude'
    if (n < -90 || n > 90) return 'Latitude must be between -90 and 90'
    return ''
  },
  longitude: v => {
    if (v === '' || v === null || v === undefined) return ''
    const n = parseFloat(v)
    if (isNaN(n)) return 'Enter a valid longitude'
    if (n < -180 || n > 180) return 'Longitude must be between -180 and 180'
    return ''
  },
  house_photo_url: v => {
    if (!v.trim()) return ''
    if (!v.startsWith('http')) return 'URL must start with http:// or https://'
    return ''
  },
}

function inputClass(touched, error) {
  const base = 'w-full px-3 py-2.5 border-2 rounded-xl text-sm focus:outline-none transition-all duration-200 bg-white font-medium'
  if (!touched) return `${base} border-gray-200 focus:border-forest-400 focus:ring-4 focus:ring-forest-100`
  if (error)    return `${base} border-red-400 bg-red-50/30 focus:border-red-400 focus:ring-4 focus:ring-red-100`
  return              `${base} border-forest-400 bg-forest-50/30 focus:border-forest-500 focus:ring-4 focus:ring-forest-100`
}

function FieldMsg({ touched, error, valid, validMsg }) {
  if (!touched) return null
  if (error) return (
    <p className="flex items-center gap-1 mt-1 text-xs text-red-600 font-medium">
      <AlertCircle className="w-3 h-3 shrink-0" />{error}
    </p>
  )
  if (valid) return (
    <p className="flex items-center gap-1 mt-1 text-xs text-forest-600 font-medium">
      <CheckCircle className="w-3 h-3 shrink-0" />{validMsg ?? 'Looks good!'}
    </p>
  )
  return null
}

function Field({ label, required, optional, error, touched, valid, validMsg, children }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1 block">
        {label}
        {required && <span className="text-red-500">*</span>}
        {optional && <span className="text-gray-400 font-normal">(optional)</span>}
      </label>
      {children}
      <FieldMsg touched={touched} error={error} valid={valid} validMsg={validMsg} />
    </div>
  )
}

export default function ManagePlots() {
  const { t } = useTranslation()
  const [plots, setPlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [touched, setTouched] = useState({})
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('plots').select('*').order('plot_number')
    setPlots(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function startEdit(plot) {
    setEditingId(plot.id)
    setTouched({})
    setEditForm({
      plot_number:    plot.plot_number,
      area_sqyards:   plot.area_sqyards ?? '',
      status:         plot.status,
      address_line:   plot.address_line ?? '',
      latitude:       plot.latitude ?? '',
      longitude:      plot.longitude ?? '',
      house_photo_url: plot.house_photo_url ?? '',
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setTouched({})
  }

  function touch(field) { setTouched(p => ({ ...p, [field]: true })) }
  function touchAll()   {
    setTouched({ plot_number: true, area_sqyards: true, latitude: true, longitude: true, house_photo_url: true })
  }

  const errors = editForm ? {
    plot_number:     RULES.plot_number(editForm.plot_number ?? ''),
    area_sqyards:    RULES.area_sqyards(editForm.area_sqyards),
    latitude:        RULES.latitude(editForm.latitude),
    longitude:       RULES.longitude(editForm.longitude),
    house_photo_url: RULES.house_photo_url(editForm.house_photo_url ?? ''),
  } : {}

  const isValid = Object.values(errors).every(e => e === '')

  async function saveEdit(id) {
    touchAll()
    if (!isValid) {
      notify.warning('Fix Errors First', 'Please correct the highlighted fields before saving.')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('plots').update({
      plot_number:    editForm.plot_number,
      status:         editForm.status,
      address_line:   editForm.address_line || null,
      area_sqyards:   editForm.area_sqyards ? parseFloat(editForm.area_sqyards) : null,
      latitude:       editForm.latitude !== '' ? parseFloat(editForm.latitude) : null,
      longitude:      editForm.longitude !== '' ? parseFloat(editForm.longitude) : null,
      house_photo_url: editForm.house_photo_url || null,
    }).eq('id', id)
    setSaving(false)
    if (error) { notify.error('Update Failed', error.message); return }
    notify.success('Plot Updated!', 'Plot details have been saved successfully.')
    setEditingId(null)
    setTouched({})
    load()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      <Link to="/admin" className="inline-flex items-center gap-2 text-forest-600 hover:text-forest-800 mb-6 text-sm font-semibold transition-colors">
        <ArrowLeft className="w-4 h-4" />Back to Dashboard
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-gray-900">{t('admin.managePlots')}</h1>
        <p className="text-gray-500 mt-1 text-sm">Update plot status, coordinates, address and photos</p>
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
            <div key={plot.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-forest-200 transition-colors">

              {editingId === plot.id ? (
                /* ── Edit Form ── */
                <div className="p-5">
                  {/* Edit header */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-forest-100 rounded-lg flex items-center justify-center">
                        <Home className="w-4 h-4 text-forest-600" />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 text-sm">Editing {plot.plot_number}</span>
                        <p className="text-xs text-gray-400">Fields marked * are required</p>
                      </div>
                    </div>
                    <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">

                    {/* Plot Number */}
                    <Field label="Plot Number" required
                      error={errors.plot_number} touched={touched.plot_number}
                      valid={!errors.plot_number && !!editForm.plot_number}>
                      <input value={editForm.plot_number}
                        onChange={e => setEditForm({ ...editForm, plot_number: e.target.value })}
                        onBlur={() => touch('plot_number')}
                        className={inputClass(touched.plot_number, errors.plot_number)}
                        placeholder="e.g. Plot-5" />
                    </Field>

                    {/* Status */}
                    <Field label="Status" required>
                      <select value={editForm.status}
                        onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-forest-400 focus:ring-4 focus:ring-forest-100 bg-white font-medium transition-all">
                        {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </select>
                    </Field>

                    {/* Area */}
                    <Field label="Area" optional
                      error={errors.area_sqyards} touched={touched.area_sqyards}
                      valid={editForm.area_sqyards !== '' && !errors.area_sqyards}
                      validMsg="Valid area">
                      <div className="relative">
                        <input type="number" value={editForm.area_sqyards}
                          onChange={e => setEditForm({ ...editForm, area_sqyards: e.target.value })}
                          onBlur={() => touch('area_sqyards')}
                          className={inputClass(touched.area_sqyards, errors.area_sqyards) + ' pr-14'}
                          placeholder="e.g. 200" min="0" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">sq.yd</span>
                      </div>
                    </Field>

                    {/* Address */}
                    <Field label="Address" optional>
                      <input value={editForm.address_line}
                        onChange={e => setEditForm({ ...editForm, address_line: e.target.value })}
                        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-forest-400 focus:ring-4 focus:ring-forest-100 bg-white font-medium transition-all"
                        placeholder="e.g. Street 2, Aranya Hills" />
                    </Field>

                    {/* Latitude */}
                    <Field label="Latitude" optional
                      error={errors.latitude} touched={touched.latitude}
                      valid={editForm.latitude !== '' && !errors.latitude}
                      validMsg="Valid latitude">
                      <div className="relative">
                        <input type="number" step="any" value={editForm.latitude}
                          onChange={e => setEditForm({ ...editForm, latitude: e.target.value })}
                          onBlur={() => touch('latitude')}
                          className={inputClass(touched.latitude, errors.latitude) + ' pl-8'}
                          placeholder="e.g. 17.3265" />
                        <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                      </div>
                    </Field>

                    {/* Longitude */}
                    <Field label="Longitude" optional
                      error={errors.longitude} touched={touched.longitude}
                      valid={editForm.longitude !== '' && !errors.longitude}
                      validMsg="Valid longitude">
                      <div className="relative">
                        <input type="number" step="any" value={editForm.longitude}
                          onChange={e => setEditForm({ ...editForm, longitude: e.target.value })}
                          onBlur={() => touch('longitude')}
                          className={inputClass(touched.longitude, errors.longitude) + ' pl-8'}
                          placeholder="e.g. 78.5312" />
                        <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                      </div>
                    </Field>

                    {/* Photo URL */}
                    <div className="sm:col-span-2">
                      <Field label="House Photo URL" optional
                        error={errors.house_photo_url} touched={touched.house_photo_url}
                        valid={editForm.house_photo_url && !errors.house_photo_url}
                        validMsg="Valid photo URL">
                        <input value={editForm.house_photo_url}
                          onChange={e => setEditForm({ ...editForm, house_photo_url: e.target.value })}
                          onBlur={() => touch('house_photo_url')}
                          className={inputClass(touched.house_photo_url, errors.house_photo_url)}
                          placeholder="https://res.cloudinary.com/..." />
                      </Field>
                    </div>
                  </div>

                  {/* Coordinates helper */}
                  <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
                    <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                      <strong>How to get coordinates:</strong> Open Google Maps → right-click on the plot location → the first line shows <em>latitude, longitude</em> — click it to copy.
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <button onClick={() => saveEdit(plot.id)} disabled={saving}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 ${
                        isValid && !saving
                          ? 'bg-gradient-to-r from-forest-600 to-forest-700 hover:from-forest-700 hover:to-forest-800 shadow-md shadow-forest-500/20 hover:-translate-y-0.5'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}>
                      {saving
                        ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
                        : <><Save className="w-3.5 h-3.5" />Save Changes</>
                      }
                    </button>
                    <button onClick={cancelEdit}
                      className="flex items-center gap-2 px-5 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
                      <X className="w-3.5 h-3.5" />Cancel
                    </button>
                  </div>
                </div>

              ) : (
                /* ── View Row ── */
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 bg-forest-100 rounded-xl flex items-center justify-center shrink-0">
                      <Home className="w-5 h-5 text-forest-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900">{plot.plot_number}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[plot.status]}`}>
                          {STATUS_LABELS[plot.status]}
                        </span>
                        {plot.area_sqyards && (
                          <span className="text-xs text-gray-400">{plot.area_sqyards} sq.yd</span>
                        )}
                        {plot.latitude && plot.longitude && (
                          <span className="text-xs text-blue-400 flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />GPS set
                          </span>
                        )}
                      </div>
                      {plot.address_line && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{plot.address_line}</p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => startEdit(plot)}
                    className="text-xs px-4 py-1.5 border-2 border-forest-200 text-forest-700 rounded-xl hover:bg-forest-50 hover:border-forest-300 transition-all font-semibold shrink-0">
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
