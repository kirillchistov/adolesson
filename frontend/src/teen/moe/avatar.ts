import logoUrl from '../../../assets/mhlogo.png'
import type { AppState } from './state/types'

export const LOGO_AVATAR_ID = 'logo'
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024
export const AVATAR_MAX_EDGE = 512
export const AVATAR_MAX_UPLOADS = 8

const TYPES = ['image/jpeg', 'image/png', 'image/webp']

const bundled = import.meta.glob('../../../assets/userpics/*.{png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default',
})

export type GalleryItem = { id: string; name: string; src: string }

export function bundledGallery(): GalleryItem[] {
  return Object.entries(bundled)
    .map(([path, src]) => {
      const name = path.split('/').pop() ?? path
      return { id: `userpic:${name}`, name, src: String(src) }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
}

export function avatarSrc(state: Pick<AppState, 'avatarId' | 'avatarUploads'>): string {
  if (state.avatarId.startsWith('userpic:')) {
    const found = bundledGallery().find((item) => item.id === state.avatarId)
    if (found) return found.src
  }
  const upload = state.avatarUploads.find((item) => item.id === state.avatarId)
  if (upload) return upload.dataUrl
  return logoUrl
}

function fileType(file: File): string {
  if (TYPES.includes(file.type)) return file.type
  const name = file.name.toLowerCase()
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg'
  if (name.endsWith('.png')) return 'image/png'
  if (name.endsWith('.webp')) return 'image/webp'
  return ''
}

export async function readAvatarFile(file: File): Promise<string> {
  if (!fileType(file)) throw new Error('Нужен JPEG, PNG или WebP.')
  if (file.size > AVATAR_MAX_BYTES) throw new Error('Файл больше 2 МБ.')
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('Не получилось прочитать картинку.')
  }
  try {
    const scale = Math.min(1, AVATAR_MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Не получилось прочитать картинку.')
    ctx.fillStyle = '#140e18'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(bitmap, 0, 0, width, height)
    const url = canvas.toDataURL('image/jpeg', 0.86)
    if (url.length > 450_000) throw new Error('После уменьшения картинка всё ещё слишком большая.')
    return url
  } finally {
    bitmap.close()
  }
}
