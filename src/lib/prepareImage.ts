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
