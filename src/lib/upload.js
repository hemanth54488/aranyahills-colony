import { supabase } from './supabase'

const BUCKET = 'colony-files'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_DOC_TYPES   = ['application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ...ALLOWED_IMAGE_TYPES]

const MAX_SIZE_MB = 5

function validateFile(file, types) {
  if (!types.includes(file.type)) {
    throw new Error(`Unsupported file type. Allowed: ${types.map(t => t.split('/')[1]).join(', ')}`)
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`File too large. Maximum size is ${MAX_SIZE_MB} MB.`)
  }
}

async function upload(file, folder, onProgress) {
  const ext      = file.name.split('.').pop().toLowerCase()
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const path     = `${folder}/${uniqueId}.${ext}`

  if (onProgress) onProgress(10)

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) throw error
  if (onProgress) onProgress(90)

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)
  if (onProgress) onProgress(100)

  return { publicUrl, path }
}

/** Upload a committee member / profile photo */
export async function uploadPhoto(file, onProgress) {
  validateFile(file, ALLOWED_IMAGE_TYPES)
  return upload(file, 'photos', onProgress)
}

/** Upload a colony document (PDF, Word, image) */
export async function uploadDocument(file, onProgress) {
  validateFile(file, ALLOWED_DOC_TYPES)
  return upload(file, 'documents', onProgress)
}

/** Delete a previously uploaded file by its storage path */
export async function deleteFile(path) {
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) throw error
}
