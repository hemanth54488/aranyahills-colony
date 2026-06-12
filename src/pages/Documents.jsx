import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import notify from '../lib/notify'
import { FileText, Download, Loader, AlertTriangle } from 'lucide-react'

const CATEGORIES = ['bylaws','meeting_minutes','financial','legal','other']
const CATEGORY_COLORS = {
  bylaws:          'bg-gold-100 text-gold-700',
  meeting_minutes: 'bg-blue-100 text-blue-700',
  financial:       'bg-forest-100 text-forest-700',
  legal:           'bg-purple-100 text-purple-700',
  other:           'bg-gray-100 text-gray-600',
}

const FILE_ICONS = {
  pdf:  '📄',
  doc:  '📝',
  docx: '📝',
  jpg:  '🖼️',
  jpeg: '🖼️',
  png:  '🖼️',
  default: '📁',
}

function getExt(url) {
  try { return url.split('?')[0].split('.').pop().toLowerCase() } catch { return '' }
}

function isPlaceholder(url) {
  return !url || url.includes('placeholder.com') || url === 'https://placeholder.com/letterhead-replace-this-url'
}

/** Download a file properly — works for Supabase Storage + external URLs */
async function downloadFile(url, name) {
  // ── Supabase Storage file ──────────────────────────
  const storageMarker = '/storage/v1/object/public/colony-files/'
  if (url.includes(storageMarker)) {
    const path = url.split(storageMarker)[1]?.split('?')[0]
    if (path) {
      const { data, error } = await supabase.storage.from('colony-files').download(path)
      if (!error && data) {
        const ext  = path.split('.').pop()
        const blob = URL.createObjectURL(data)
        const a    = document.createElement('a')
        a.href     = blob
        a.download = `${name}.${ext}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(blob)
        return true
      }
    }
  }

  // ── Google Drive share link → direct download ──────
  if (url.includes('drive.google.com')) {
    const idMatch = url.match(/[-\w]{25,}/)
    if (idMatch) {
      window.open(`https://drive.google.com/uc?export=download&id=${idMatch[0]}`, '_blank')
      return true
    }
  }

  // ── Generic: try fetch → blob (works for same-origin + CORS-enabled) ──
  try {
    const res  = await fetch(url)
    if (!res.ok) throw new Error('Fetch failed')
    const blob = await res.blob()
    const ext  = getExt(url)
    const objUrl = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = objUrl
    a.download = ext ? `${name}.${ext}` : name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(objUrl)
    return true
  } catch {
    // Final fallback: open in new tab
    window.open(url, '_blank')
    return true
  }
}

export default function Documents() {
  const { t } = useTranslation()
  const { isAdmin } = useAuth()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('all')
  const [downloading, setDownloading] = useState(null) // doc id currently downloading

  useEffect(() => {
    supabase.from('documents').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setDocs(data ?? []); setLoading(false) })
  }, [])

  async function handleDownload(doc) {
    if (isPlaceholder(doc.file_url)) {
      notify.warning('Not available', 'This document has a placeholder URL. Admin needs to upload the real file.')
      return
    }
    setDownloading(doc.id)
    try {
      await downloadFile(doc.file_url, doc.name)
    } catch (err) {
      notify.error('Download failed', err.message)
    } finally {
      setDownloading(null)
    }
  }

  async function deletePlaceholder(id) {
    if (!window.confirm('Delete this placeholder document entry?')) return
    await supabase.from('documents').delete().eq('id', id)
    setDocs(d => d.filter(x => x.id !== id))
    notify.success('Removed', 'Go to Admin → Documents to add the real file.')
  }

  const filtered = filterCategory === 'all' ? docs : docs.filter(d => d.category === filterCategory)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-forest-800">{t('documents.title')}</h1>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button onClick={() => setFilterCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterCategory === 'all' ? 'bg-forest-700 text-white' : 'bg-white border border-forest-200 text-forest-600 hover:bg-forest-50'}`}>
          {t('documents.allDocs')}
        </button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilterCategory(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterCategory === c ? 'bg-forest-700 text-white' : 'bg-white border border-forest-200 text-forest-600 hover:bg-forest-50'}`}>
            {t(`documents.${c}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_,i) => <div key={i} className="h-16 bg-forest-50 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14 text-forest-400">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">{t('documents.noDocuments')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(doc => {
            const ext         = getExt(doc.file_url)
            const icon        = FILE_ICONS[ext] ?? FILE_ICONS.default
            const placeholder = isPlaceholder(doc.file_url)
            const isLoading   = downloading === doc.id

            return (
              <div key={doc.id}
                className={`bg-white border rounded-xl p-4 flex items-center justify-between gap-3 hover:shadow-sm transition-shadow ${placeholder ? 'border-amber-200 bg-amber-50/30' : 'border-forest-100'}`}>

                {/* Left: icon + info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl ${placeholder ? 'bg-amber-100' : 'bg-forest-50'}`}>
                    {placeholder ? '⚠️' : icon}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-forest-800 text-sm truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${CATEGORY_COLORS[doc.category]}`}>
                        {t(`documents.${doc.category}`)}
                      </span>
                      <span className="text-xs text-forest-400">
                        {new Date(doc.created_at).toLocaleDateString('en-IN')}
                      </span>
                      {placeholder && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                          Placeholder — file not uploaded yet
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {placeholder && isAdmin && (
                    <button
                      onClick={() => deletePlaceholder(doc.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
                      Remove
                    </button>
                  )}
                  <button
                    onClick={() => handleDownload(doc)}
                    disabled={isLoading || placeholder}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                      placeholder
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-forest-700 hover:bg-forest-800 text-white'
                    } disabled:opacity-60`}
                  >
                    {isLoading
                      ? <><Loader className="w-3.5 h-3.5 animate-spin" />Downloading...</>
                      : <><Download className="w-3.5 h-3.5" />{t('documents.download')}</>
                    }
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
