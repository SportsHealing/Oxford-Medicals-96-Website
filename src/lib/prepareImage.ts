// Shrinks large phone photos before upload so they load quickly for everyone.
// Falls back to the original file if the browser cannot decode it (e.g. HEIC
// outside Safari) or if it is already small.

const MAX_EDGE = 2400
const QUALITY = 0.85

export async function prepareImage(file: File): Promise<File> {
  if (file.size < 1_500_000) return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.type === 'image/jpeg') return file
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', QUALITY))
    if (!blob) return file
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    return file
  }
}

// A small copy of a photo for grids. Returns null if the browser cannot decode
// the file, in which case the site just uses the full-size picture.
export async function makeThumbnail(file: File, edge = 640): Promise<File | null> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.8))
    return blob ? new File([blob], 'thumb.jpg', { type: 'image/jpeg' }) : null
  } catch {
    return null
  }
}

// Square-crops and shrinks a picture for use as a profile photo.
export async function makeAvatar(file: File, size = 512): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file)
    const side = Math.min(bitmap.width, bitmap.height)
    const sx = (bitmap.width - side) / 2
    const sy = (bitmap.height - side) / 2
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = Math.min(size, side)
    canvas.getContext('2d')?.drawImage(bitmap, sx, sy, side, side, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.88))
    return blob ? new File([blob], 'avatar.jpg', { type: 'image/jpeg' }) : file
  } catch {
    return file
  }
}
