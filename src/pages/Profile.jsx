import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import notify from '../lib/notify'
import {
  User, Phone, Globe, Plus, Trash2, Save, Car,
  Users, AlertCircle, CheckCircle, IdCard, MapPin, Home
} from 'lucide-react'
import PhotoUpload from '../components/PhotoUpload'

const VEHICLE_TYPES = ['car','bike','scooter','truck','other']

const RULES = {
  full_name: v => {
    if (!v?.trim()) return 'Full name is required'
    if (v.trim().length < 3) return 'Name must be at least 3 characters'
    return ''
  },
  phone: v => {
    if (!v?.trim()) return ''
    const digits = v.replace(/\D/g,'')
    if (digits.length !== 10) return 'Enter a valid 10-digit mobile number'
    if (!/^[6-9]/.test(digits)) return 'Number must start with 6, 7, 8 or 9'
    return ''
  },
  avatar_url: v => {
    if (!v?.trim()) return ''
    if (!v.startsWith('http')) return 'URL must start with http:// or https://'
    return ''
  },
  registration_number: v => {
    if (!v?.trim()) return 'Registration number is required'
    if (v.trim().length < 4) return 'Enter a valid registration number'
    return ''
  },
  make_model: v => {
    if (!v?.trim()) return 'Make/Model is required'
    return ''
  },
  member_name: v => {
    if (!v?.trim()) return 'Name is required'
    if (v.trim().length < 2) return 'Name too short'
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

const TABS = ['info','family','vehicles']

export default function Profile() {
  const { t } = useTranslation()
  const { profile, refreshProfile } = useAuth()
  const [tab, setTab] = useState('info')

  // Info state
  const [form, setForm] = useState({ full_name: '', phone: '', avatar_url: '', preferred_language: 'en', plot_id: '' })
  const [touched, setTouched] = useState({})
  const [saving, setSaving] = useState(false)
  const [plots, setPlots] = useState([])

  // Family state
  const [family, setFamily] = useState([])
  const [loadingFamily, setLoadingFamily] = useState(true)
  const [newMember, setNewMember] = useState({ name: '', relation: '', phone: '' })
  const [memberTouched, setMemberTouched] = useState({})
  const [addingMember, setAddingMember] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)

  // Vehicles state
  const [vehicles, setVehicles] = useState([])
  const [loadingVehicles, setLoadingVehicles] = useState(true)
  const [newVehicle, setNewVehicle] = useState({ vehicle_type: 'car', make_model: '', registration_number: '', color: '' })
  const [vehicleTouched, setVehicleTouched] = useState({})
  const [addingVehicle, setAddingVehicle] = useState(false)
  const [showAddVehicle, setShowAddVehicle] = useState(false)

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? '',
        phone: profile.phone ?? '',
        avatar_url: profile.avatar_url ?? '',
        preferred_language: profile.preferred_language ?? 'en',
        plot_id: profile.plot_id ?? '',
      })
    }
  }, [profile])

  useEffect(() => {
    supabase.from('plots').select('id, plot_number, status').order('plot_number')
      .then(({ data }) => setPlots(data ?? []))
  }, [])

  useEffect(() => {
    if (!profile?.plot_id) { setLoadingFamily(false); return }
    supabase
      .from('family_members')
      .select('*')
      .eq('plot_id', profile.plot_id)
      .order('created_at')
      .then(({ data }) => { setFamily(data ?? []); setLoadingFamily(false) })
  }, [profile?.plot_id])

  useEffect(() => {
    if (!profile?.id) { setLoadingVehicles(false); return }
    supabase
      .from('vehicles')
      .select('*')
      .eq('profile_id', profile.id)
      .order('created_at')
      .then(({ data }) => { setVehicles(data ?? []); setLoadingVehicles(false) })
  }, [profile?.id])

  const errors = {
    full_name: RULES.full_name(form.full_name),
    phone: RULES.phone(form.phone),
    avatar_url: RULES.avatar_url(form.avatar_url),
  }
  const formValid = !errors.full_name && !errors.phone && !errors.avatar_url

  async function saveProfile() {
    setTouched({ full_name: true, phone: true, avatar_url: true })
    if (!formValid) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        avatar_url: form.avatar_url.trim(),
        preferred_language: form.preferred_language,
        plot_id: form.plot_id || null,
      })
      .eq('id', profile.id)
    setSaving(false)
    if (error) { notify.error('Save failed', error.message); return }
    notify.success(t('profile.profileUpdated'))
    refreshProfile()
  }

  async function addFamilyMember() {
    setMemberTouched({ name: true })
    const nameErr = RULES.member_name(newMember.name)
    if (nameErr) return
    setAddingMember(true)
    const { error } = await supabase
      .from('family_members')
      .insert({ plot_id: profile.plot_id, name: newMember.name.trim(), relation: newMember.relation.trim(), phone: newMember.phone.trim() })
    setAddingMember(false)
    if (error) { notify.error('Failed to add member', error.message); return }
    notify.success('Family member added')
    setNewMember({ name: '', relation: '', phone: '' })
    setMemberTouched({})
    setShowAddMember(false)
    const { data } = await supabase.from('family_members').select('*').eq('plot_id', profile.plot_id).order('created_at')
    setFamily(data ?? [])
  }

  async function deleteFamilyMember(id) {
    if (!window.confirm('Remove this family member?')) return
    const { error } = await supabase.from('family_members').delete().eq('id', id)
    if (error) { notify.error('Delete failed', error.message); return }
    setFamily(f => f.filter(m => m.id !== id))
    notify.success('Removed')
  }

  async function addVehicle() {
    setVehicleTouched({ make_model: true, registration_number: true })
    if (RULES.make_model(newVehicle.make_model) || RULES.registration_number(newVehicle.registration_number)) return
    setAddingVehicle(true)
    const { error } = await supabase
      .from('vehicles')
      .insert({ profile_id: profile.id, plot_id: profile.plot_id, ...newVehicle, registration_number: newVehicle.registration_number.toUpperCase().trim() })
    setAddingVehicle(false)
    if (error) { notify.error('Failed to add vehicle', error.message); return }
    notify.success('Vehicle added')
    setNewVehicle({ vehicle_type: 'car', make_model: '', registration_number: '', color: '' })
    setVehicleTouched({})
    setShowAddVehicle(false)
    const { data } = await supabase.from('vehicles').select('*').eq('profile_id', profile.id).order('created_at')
    setVehicles(data ?? [])
  }

  async function deleteVehicle(id) {
    if (!window.confirm('Remove this vehicle?')) return
    const { error } = await supabase.from('vehicles').delete().eq('id', id)
    if (error) { notify.error('Delete failed', error.message); return }
    setVehicles(v => v.filter(x => x.id !== id))
    notify.success('Removed')
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-forest-800">{t('profile.title')}</h1>
          <p className="text-forest-500 text-sm mt-1">{profile?.plots?.plot_number} · {profile?.role}</p>
        </div>
        <Link to="/profile/id-card"
          className="flex items-center gap-2 px-4 py-2.5 bg-forest-700 hover:bg-forest-800 text-white text-sm font-semibold rounded-xl transition-colors">
          <IdCard className="w-4 h-4" />
          {t('idcard.title')}
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-forest-50 p-1 rounded-xl mb-6 border border-forest-100">
        {TABS.map(t2 => (
          <button key={t2} onClick={() => setTab(t2)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              tab === t2 ? 'bg-white text-forest-800 shadow-sm' : 'text-forest-500 hover:text-forest-700'
            }`}>
            {t(`profile.${t2}`)}
          </button>
        ))}
      </div>

      {/* ── INFO TAB ─── */}
      {tab === 'info' && (
        <div className="bg-white rounded-2xl border border-forest-100 p-6 space-y-5">
          {/* Avatar upload */}
          <div>
            <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-3">
              Profile Photo
            </label>
            <PhotoUpload
              currentUrl={form.avatar_url}
              initials={form.full_name?.[0]?.toUpperCase() ?? '?'}
              size="md"
              label="Upload Profile Photo"
              onUploaded={url => setForm(f => ({ ...f, avatar_url: url }))}
            />
          </div>

          {/* Full name */}
          <div>
            <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">
              <User className="w-3 h-3 inline mr-1" />Full Name *
            </label>
            <input
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              onBlur={() => setTouched(p => ({ ...p, full_name: true }))}
              className={inputClass(touched.full_name, errors.full_name)}
              placeholder="Your full name"
            />
            <FieldMsg touched={touched.full_name} error={errors.full_name} />
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">
              <Phone className="w-3 h-3 inline mr-1" />{t('profile.phone')}
            </label>
            <input
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              onBlur={() => setTouched(p => ({ ...p, phone: true }))}
              className={inputClass(touched.phone, errors.phone)}
              placeholder="10-digit mobile number"
              maxLength={10}
            />
            <FieldMsg touched={touched.phone} error={errors.phone} />
          </div>

          {/* Plot */}
          <div>
            <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">
              <Home className="w-3 h-3 inline mr-1" />My Plot
            </label>
            {profile?.plot_id && !form.plot_id ? null : null}
            <select
              value={form.plot_id}
              onChange={e => setForm(f => ({ ...f, plot_id: e.target.value }))}
              className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-forest-400 bg-white">
              <option value="">— No plot assigned —</option>
              {plots.map(p => (
                <option key={p.id} value={p.id}>
                  {p.plot_number}
                  {p.status === 'occupied' ? ' (occupied)' : p.status === 'under_construction' ? ' (under construction)' : ' (vacant)'}
                </option>
              ))}
            </select>
            {form.plot_id && (
              <p className="flex items-center gap-1 mt-1 text-xs text-forest-600 font-medium">
                <MapPin className="w-3 h-3" />
                {plots.find(p => p.id === form.plot_id)?.plot_number} linked to your account
              </p>
            )}
            <p className="text-[10px] text-forest-400 mt-1">
              Linking your plot lets you add family members, vehicles, and pay maintenance fees.
            </p>
          </div>

          {/* Language */}
          <div>
            <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">
              <Globe className="w-3 h-3 inline mr-1" />{t('profile.language')}
            </label>
            <select
              value={form.preferred_language}
              onChange={e => setForm(f => ({ ...f, preferred_language: e.target.value }))}
              className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-forest-400 bg-white">
              <option value="en">English</option>
              <option value="te">తెలుగు</option>
              <option value="hi">हिंदी</option>
            </select>
          </div>

          <div className="pt-2">
            <button onClick={saveProfile} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-sm">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : t('profile.saveChanges')}
            </button>
          </div>
        </div>
      )}

      {/* ── FAMILY TAB ─── */}
      {tab === 'family' && (
        <div className="space-y-3">
          {!profile?.plot_id && (
            <div className="bg-earth-50 border border-earth-200 rounded-xl p-4 text-earth-700 text-sm">
              No plot assigned to your account yet.
            </div>
          )}
          {loadingFamily ? (
            <div className="space-y-2">{[...Array(3)].map((_,i) => <div key={i} className="h-14 bg-forest-50 rounded-xl animate-pulse" />)}</div>
          ) : (
            <>
              {family.map(m => (
                <div key={m.id} className="bg-white border border-forest-100 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-forest-800 text-sm">{m.name}</p>
                    <p className="text-xs text-forest-400">{m.relation}{m.phone ? ` · ${m.phone}` : ''}</p>
                  </div>
                  <button onClick={() => deleteFamilyMember(m.id)}
                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {family.length === 0 && !showAddMember && (
                <div className="text-center py-10 text-forest-400">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No family members added yet</p>
                </div>
              )}

              {showAddMember ? (
                <div className="bg-forest-50 border border-forest-200 rounded-xl p-4 space-y-3">
                  <p className="font-semibold text-forest-700 text-sm">{t('profile.addFamily')}</p>
                  <input
                    value={newMember.name}
                    onChange={e => setNewMember(m => ({ ...m, name: e.target.value }))}
                    onBlur={() => setMemberTouched(p => ({ ...p, name: true }))}
                    placeholder={`${t('profile.name')} *`}
                    className={inputClass(memberTouched.name, RULES.member_name(newMember.name))}
                  />
                  <FieldMsg touched={memberTouched.name} error={RULES.member_name(newMember.name)} />
                  <input
                    value={newMember.relation}
                    onChange={e => setNewMember(m => ({ ...m, relation: e.target.value }))}
                    placeholder={t('profile.relation')}
                    className={inputClass(false, '')}
                  />
                  <input
                    value={newMember.phone}
                    onChange={e => setNewMember(m => ({ ...m, phone: e.target.value }))}
                    placeholder="Phone (optional)"
                    className={inputClass(false, '')}
                    maxLength={10}
                  />
                  <div className="flex gap-2">
                    <button onClick={addFamilyMember} disabled={addingMember}
                      className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition-colors">
                      {addingMember ? 'Adding...' : t('common.add')}
                    </button>
                    <button onClick={() => { setShowAddMember(false); setMemberTouched({}) }}
                      className="px-4 py-2 border border-forest-200 text-forest-600 text-sm rounded-xl hover:bg-forest-50 transition-colors">
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowAddMember(true)}
                  className="flex items-center gap-2 w-full px-4 py-3 border-2 border-dashed border-forest-200 rounded-xl text-forest-500 hover:border-forest-400 hover:text-forest-700 transition-all text-sm font-medium">
                  <Plus className="w-4 h-4" />{t('profile.addFamily')}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* ── VEHICLES TAB ─── */}
      {tab === 'vehicles' && (
        <div className="space-y-3">
          {loadingVehicles ? (
            <div className="space-y-2">{[...Array(2)].map((_,i) => <div key={i} className="h-16 bg-forest-50 rounded-xl animate-pulse" />)}</div>
          ) : (
            <>
              {vehicles.map(v => (
                <div key={v.id} className="bg-white border border-forest-100 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Car className="w-5 h-5 text-forest-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-forest-800 text-sm">{v.registration_number}</p>
                      <p className="text-xs text-forest-400">{v.make_model}{v.color ? ` · ${v.color}` : ''} · {v.vehicle_type}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteVehicle(v.id)}
                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {vehicles.length === 0 && !showAddVehicle && (
                <div className="text-center py-10 text-forest-400">
                  <Car className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No vehicles added yet</p>
                </div>
              )}

              {showAddVehicle ? (
                <div className="bg-forest-50 border border-forest-200 rounded-xl p-4 space-y-3">
                  <p className="font-semibold text-forest-700 text-sm">{t('profile.addVehicle')}</p>
                  <select
                    value={newVehicle.vehicle_type}
                    onChange={e => setNewVehicle(v => ({ ...v, vehicle_type: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-forest-400 bg-white">
                    {VEHICLE_TYPES.map(vt => <option key={vt} value={vt}>{t(`profile.${vt}`)}</option>)}
                  </select>
                  <input
                    value={newVehicle.make_model}
                    onChange={e => setNewVehicle(v => ({ ...v, make_model: e.target.value }))}
                    onBlur={() => setVehicleTouched(p => ({ ...p, make_model: true }))}
                    placeholder={`${t('profile.makeModel')} *`}
                    className={inputClass(vehicleTouched.make_model, RULES.make_model(newVehicle.make_model))}
                  />
                  <FieldMsg touched={vehicleTouched.make_model} error={RULES.make_model(newVehicle.make_model)} />
                  <input
                    value={newVehicle.registration_number}
                    onChange={e => setNewVehicle(v => ({ ...v, registration_number: e.target.value.toUpperCase() }))}
                    onBlur={() => setVehicleTouched(p => ({ ...p, registration_number: true }))}
                    placeholder={`${t('profile.regNumber')} * (e.g. TS09AB1234)`}
                    className={inputClass(vehicleTouched.registration_number, RULES.registration_number(newVehicle.registration_number))}
                  />
                  <FieldMsg touched={vehicleTouched.registration_number} error={RULES.registration_number(newVehicle.registration_number)} />
                  <input
                    value={newVehicle.color}
                    onChange={e => setNewVehicle(v => ({ ...v, color: e.target.value }))}
                    placeholder={`${t('profile.color')} (optional)`}
                    className={inputClass(false, '')}
                  />
                  <div className="flex gap-2">
                    <button onClick={addVehicle} disabled={addingVehicle}
                      className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition-colors">
                      {addingVehicle ? 'Adding...' : t('common.add')}
                    </button>
                    <button onClick={() => { setShowAddVehicle(false); setVehicleTouched({}) }}
                      className="px-4 py-2 border border-forest-200 text-forest-600 text-sm rounded-xl hover:bg-forest-50 transition-colors">
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowAddVehicle(true)}
                  className="flex items-center gap-2 w-full px-4 py-3 border-2 border-dashed border-forest-200 rounded-xl text-forest-500 hover:border-forest-400 hover:text-forest-700 transition-all text-sm font-medium">
                  <Plus className="w-4 h-4" />{t('profile.addVehicle')}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
