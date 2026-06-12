import { useRef, useState } from 'react'
import { uploadPhoto } from '../lib/upload'
import notify from '../lib/notify'
import { Camera, Upload, X, Loader } from 'lucide-react'

/**
 * PhotoUpload — drop-in photo picker with Supabase Storage upload.
 *
 * Props:
 *   currentUrl  string   — existing photo URL (shows preview)
 *   onUploaded  fn(url)  — called with the new public URL on success
 *   size        'sm'|'md'|'lg'  — avatar display size (default 'md')
 *   label       string   — button label (default 'Upload Photo')
 *   initials    string   — fallback initials when no photo
 */
export default function PhotoUpload({ currentUrl, onUploaded, size = 'md', label = 'Upload Photo', initials = '?' }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [preview, setPreview] = useState(currentUrl ?? null)
  const fileRef = useRef(null)

  const sizeMap = {
    sm: { box: 'w-12 h-12', text: 'text-sm', icon: 'w-3.5 h-3.5' },
    md: { box: 'w-20 h-20', text: 'text-xl', icon: 'w-4 h-4' },
    lg: { box: 'w-28 h-28', text: 'text-3xl', icon: 'w-5 h-5' },
  }
  const s = sizeMap[size]

  async function handleChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)
    setUploading(true)
    setProgress(0)

    try {
      const { publicUrl } = await uploadPhoto(file, p => setProgress(p))
      setPreview(publicUrl)
      onUploaded(publicUrl)
      notify.success('Photo uploaded!', 'Photo saved successfully.')
    } catch (err) {
      setPreview(currentUrl ?? null)
      notify.error('Upload failed', err.message)
    } finally {
      setUploading(false)
      setProgress(0)
      e.target.value = ''
    }
  }

  function clearPhoto() {
    setPreview(null)
    onUploaded('')
  }

  return (
    <div className="flex items-center gap-4">
      {/* Avatar preview */}
      <div className={`relative ${s.box} rounded-2xl overflow-hidden bg-gradient-to-br from-forest-100 to-forest-200 border-2 border-forest-200 shrink-0`}>
        {preview ? (
          <img src={preview} alt="Photo" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className={`font-display font-bold text-forest-600 ${s.text}`}>{initials}</span>
          </div>
        )}

        {/* Upload progress overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-forest-900/60 flex flex-col items-center justify-center gap-1">
            <Loader className={`${s.icon} text-white animate-spin`} />
            <span className="text-white text-[10px] font-bold">{progress}%</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={handleChange}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {uploading
            ? <><Loader className="w-4 h-4 animate-spin" />Uploading {progress}%</>
            : <><Camera className="w-4 h-4" />{label}</>
          }
        </button>
        {preview && !uploading && (
          <button
            type="button"
            onClick={clearPhoto}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            <X className="w-3 h-3" />Remove photo
          </button>
        )}
        <p className="text-[10px] text-forest-400">JPG, PNG or WebP · Max 5 MB</p>
      </div>
    </div>
  )
}
