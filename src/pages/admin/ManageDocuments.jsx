import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import notify from '../../lib/notify'
import { FileText, Plus, ArrowLeft, Trash2, X, AlertCircle, ExternalLink, Globe, Lock, Upload, Loader } from 'lucide-react'
import { uploadDocument } from '../../lib/upload'

const CATEGORIES = ['bylaws','meeting_minutes','financial','legal','other']
const CATEGORY_LABELS = {
  bylaws: 'Bylaws',
  meeting_minutes: 'Meeting Minutes',
  financial: 'Financial Reports',
  legal: 'Legal Documents',
  other: 'Other Documents',
}
const CATEGORY_COLORS = {
  bylaws: 'bg-gold-100 text-gold-700 border-gold-200',
  meeting_minutes: 'bg-blue-100 text-blue-700 border-blue-200',
  financial: 'bg-forest-100 text-forest-700 border-forest-200',
  legal: 'bg-purple-100 text-purple-700 border-purple-200',
  other: 'bg-gray-100 text-gray-600 border-gray-200',
}

const RULES = {
  name: v => {
    if (!v?.trim()) return 'Document name is required'
    if (v.trim().length < 3) return 'Name too short'
    if (v.trim().length > 150) return 'Name too long (max 150 chars)'
    return ''
  },
  file_url: v => {
    if (!v?.trim()) return 'File URL is required'
    if (!v.startsWith('http')) return 'URL must start with http:// or https://'
    return ''
  },
}

function inputClass(touched, error) {
  const base = 'w-full px-3.5 py-2.5 border-2 rounded-xl text-sm focus:outline-none transition-all bg-white'
  if (!touched) return `${base} border-gray-200 focus:border-forest-400 focus:ring-4 focus:ring-forest-100`
  if (error)    return `${base} border-red-400 bg-red-50/30 focus:border-red-400 focus:ring-4 focus:ring-red-100`
  return              `${base} border-forest-400 bg-forest-50/30 focus:border-forest-500 focus:ring-4 focus:ring-forest-100`
}

function FieldMsg({ touched, error }) {
  if (!touched || !error) return null
  return (
    <p className="flex items-center gap-1 mt-1 text-xs text-red-600 font-medium">
      <AlertCircle className="w-3 h-3 shrink-0" />{error}
    </p>
  )
}

const EMPTY = { name: '', file_url: '', category: 'bylaws', is_public: false }

export default function ManageDocuments() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [touched, setTouched] = useState({})
  const [saving, setSaving] = useState(false)
  const [filterCategory, setFilterCategory] = useState('all')

  function fetchDocs() {
    supabase.from('documents').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setDocs(data ?? []); setLoading(false) })
  }
  useEffect(() => { fetchDocs() }, [])

  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef(null)

  const errors = { name: RULES.name(form.name), file_url: RULES.file_url(form.file_url) }
  const formValid = !errors.name && !errors.file_url

  async function save() {
    setTouched({ name: true, file_url: true })
    if (!formValid) return
    setSaving(true)
    const { error } = await supabase.from('documents').insert({
      name: form.name.trim(),
      file_url: form.file_url.trim(),
      category: form.category,
      is_public: form.is_public,
      uploaded_by: profile.id,
    })
    setSaving(false)
    if (error) { notify.error('Upload failed', error.message); return }
    notify.success('Document added successfully')
    setShowModal(false)
    setForm(EMPTY)
    setTouched({})
    fetchDocs()
  }

  async function togglePublic(doc) {
    const { error } = await supabase.from('documents').update({ is_public: !doc.is_public }).eq('id', doc.id)
    if (error) { notify.error('Update failed', error.message); return }
    setDocs(d => d.map(x => x.id === doc.id ? { ...x, is_public: !doc.is_public } : x))
    notify.success(doc.is_public ? 'Document set to members-only' : 'Document is now public')
  }

  async function deleteDoc(id, name) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    const { error } = await supabase.from('documents').delete().eq('id', id)
    if (error) { notify.error('Delete failed', error.message); return }
    setDocs(d => d.filter(x => x.id !== id))
    notify.success('Document deleted')
  }

  const filtered = filterCategory === 'all' ? docs : docs.filter(d => d.category === filterCategory)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link to="/admin" className="p-2 rounded-xl text-forest-500 hover:bg-forest-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold text-forest-800">Manage Documents</h1>
          <p className="text-forest-500 text-sm mt-0.5">Add bylaws, meeting minutes, financial reports and other colony documents</p>
        </div>
        <button onClick={() => { setShowModal(true); setForm(EMPTY); setTouched({}) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold text-sm rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Add Document
        </button>
      </div>

      {/* Upload info */}
      <div className="bg-forest-50 border border-forest-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Upload className="w-4 h-4 text-forest-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-forest-800 text-sm font-semibold">Upload directly from your device</p>
          <p className="text-forest-600 text-xs mt-0.5">PDFs, Word documents, and images are supported (max 5 MB). Files are stored securely in Supabase Storage.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {CATEGORIES.map(cat => {
          const count = docs.filter(d => d.category === cat).length
          return (
            <button key={cat} onClick={() => setFilterCategory(filterCategory === cat ? 'all' : cat)}
              className={`rounded-xl p-3 text-left border transition-all ${filterCategory === cat ? 'border-forest-600 bg-forest-700 text-white' : 'bg-white border-forest-100 hover:border-forest-300'}`}>
              <p className={`text-2xl font-bold font-display ${filterCategory === cat ? 'text-white' : 'text-forest-800'}`}>{count}</p>
              <p className={`text-xs mt-0.5 ${filterCategory === cat ? 'text-white/80' : 'text-forest-500'}`}>{CATEGORY_LABELS[cat]}</p>
            </button>
          )
        })}
      </div>

      {/* Reset filter */}
      {filterCategory !== 'all' && (
        <button onClick={() => setFilterCategory('all')} className="mb-4 text-xs text-forest-500 hover:text-forest-700 underline transition-colors">
          Show all documents
        </button>
      )}

      {/* Document list */}
      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_,i) => <div key={i} className="h-16 bg-forest-50 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-forest-400 bg-white rounded-2xl border border-forest-100">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-semibold text-forest-600">No documents yet</p>
          <p className="text-sm mt-1">Click "Add Document" to upload your first document</p>
          <button onClick={() => { setShowModal(true); setForm(EMPTY); setTouched({}) }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white text-sm font-semibold rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> Add First Document
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(doc => (
            <div key={doc.id} className="bg-white border border-forest-100 rounded-xl p-4 flex items-center gap-4 hover:shadow-sm transition-shadow group">
              {/* Icon */}
              <div className="w-10 h-10 bg-forest-50 rounded-xl flex items-center justify-center shrink-0 border border-forest-100">
                <FileText className="w-5 h-5 text-forest-500" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-forest-800 text-sm truncate">{doc.name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${CATEGORY_COLORS[doc.category]}`}>
                    {CATEGORY_LABELS[doc.category]}
                  </span>
                  <span className={`text-[10px] flex items-center gap-1 font-medium ${doc.is_public ? 'text-forest-600' : 'text-forest-400'}`}>
                    {doc.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    {doc.is_public ? 'Public' : 'Members only'}
                  </span>
                  <span className="text-[10px] text-forest-400">
                    Added {new Date(doc.created_at).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-forest-50 border border-forest-200 text-forest-700 hover:bg-forest-100 text-xs font-semibold rounded-lg transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" /> View
                </a>
                <button onClick={() => togglePublic(doc)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                    doc.is_public
                      ? 'bg-forest-50 border-forest-200 text-forest-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-forest-50 hover:text-forest-700 hover:border-forest-200'
                  }`}
                  title={doc.is_public ? 'Click to make members-only' : 'Click to make public'}>
                  {doc.is_public ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  {doc.is_public ? 'Public' : 'Private'}
                </button>
                <button onClick={() => deleteDoc(doc.id, doc.name)}
                  className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Document Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-forest-100">
              <h2 className="font-display font-bold text-forest-800 text-lg">Add Document</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-forest-400 hover:bg-forest-50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-1.5">
                  Document Name *
                </label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  onBlur={() => setTouched(p => ({ ...p, name: true }))}
                  placeholder="e.g. Colony Bylaws 2024, AGM Minutes March 2025"
                  className={inputClass(touched.name, errors.name)}
                />
                <FieldMsg touched={touched.name} error={errors.name} />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-2">
                  Category *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(cat => (
                    <button key={cat} type="button"
                      onClick={() => setForm(f => ({ ...f, category: cat }))}
                      className={`px-3 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all text-left ${
                        form.category === cat
                          ? 'border-forest-600 bg-forest-50 text-forest-800'
                          : 'border-gray-200 text-forest-600 hover:border-forest-300 hover:bg-forest-50/50'
                      }`}>
                      {CATEGORY_LABELS[cat]}
                    </button>
                  ))}
                </div>
              </div>

              {/* File — upload OR paste URL */}
              <div>
                <label className="text-xs font-semibold text-forest-600 uppercase tracking-wide block mb-2">
                  File *
                </label>

                {/* Upload from device */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  className="hidden"
                  onChange={async e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setUploading(true)
                    setUploadProgress(0)
                    try {
                      const { publicUrl } = await uploadDocument(file, p => setUploadProgress(p))
                      setForm(f => ({ ...f, file_url: publicUrl }))
                      setTouched(p => ({ ...p, file_url: true }))
                      notify.success('File uploaded!', 'Document stored in Supabase Storage.')
                    } catch (err) {
                      notify.error('Upload failed', err.message)
                    } finally {
                      setUploading(false)
                      e.target.value = ''
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-forest-300 rounded-xl text-sm font-semibold text-forest-600 hover:bg-forest-50 hover:border-forest-500 disabled:opacity-60 transition-all mb-3"
                >
                  {uploading
                    ? <><Loader className="w-4 h-4 animate-spin" />Uploading {uploadProgress}%...</>
                    : <><Upload className="w-4 h-4" />Click to upload from your device</>
                  }
                </button>

                {/* Progress bar */}
                {uploading && (
                  <div className="w-full bg-forest-100 rounded-full h-1.5 mb-3">
                    <div className="bg-forest-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}

                {/* OR paste URL */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-medium">or paste a URL</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <input
                  value={form.file_url}
                  onChange={e => setForm(f => ({ ...f, file_url: e.target.value }))}
                  onBlur={() => setTouched(p => ({ ...p, file_url: true }))}
                  placeholder="https://drive.google.com/..."
                  className={inputClass(touched.file_url, errors.file_url)}
                />
                <FieldMsg touched={touched.file_url} error={errors.file_url} />
                {form.file_url && !errors.file_url && (
                  <a href={form.file_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1.5 text-xs text-forest-600 hover:text-forest-800 font-medium transition-colors">
                    <ExternalLink className="w-3 h-3" /> Test this link
                  </a>
                )}
              </div>

              {/* Visibility */}
              <div className="flex items-center justify-between p-3.5 bg-forest-50 rounded-xl border border-forest-100">
                <div className="flex items-center gap-2.5">
                  {form.is_public ? <Globe className="w-4 h-4 text-forest-600" /> : <Lock className="w-4 h-4 text-forest-400" />}
                  <div>
                    <p className="text-sm font-semibold text-forest-800">
                      {form.is_public ? 'Visible to everyone' : 'Members only'}
                    </p>
                    <p className="text-xs text-forest-500">
                      {form.is_public ? 'Anyone visiting the site can download' : 'Only logged-in approved residents'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, is_public: !f.is_public }))}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${form.is_public ? 'bg-forest-600' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.is_public ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            <div className="px-6 pb-5 flex gap-3">
              <button onClick={save} disabled={saving}
                className="flex-1 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold rounded-xl disabled:opacity-60 transition-colors text-sm">
                {saving ? 'Adding...' : 'Add Document'}
              </button>
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-forest-200 text-forest-600 rounded-xl hover:bg-forest-50 transition-colors text-sm">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
