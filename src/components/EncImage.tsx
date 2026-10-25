import { useEffect, useState, type ImgHTMLAttributes } from 'react'
import { pictureUrl } from '../data/archive.ts'

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & { path: string }

// An <img> whose picture comes from the encrypted archive. Shows nothing until
// the picture has been fetched and decrypted; the browser's own lazy loading
// cannot help here, so grids draw a page of these at a time.
type State = { path: string; src: string | null; failed: boolean }

export default function EncImage({ path, alt = '', className = '', ...rest }: Props) {
  const [state, setState] = useState<State>({ path, src: null, failed: false })
  // A new path starts blank until its picture arrives.
  const { src, failed } = state.path === path ? state : { src: null, failed: false }

  useEffect(() => {
    let live = true
    pictureUrl(path).then(
      (u) => live && setState({ path, src: u, failed: false }),
      () => live && setState({ path, src: null, failed: true }),
    )
    return () => {
      live = false
    }
  }, [path])

  if (failed) {
    return (
      <span role="img" aria-label={alt || 'Picture unavailable'} className={`flex items-center justify-center bg-paper font-sans text-xs text-muted ${className}`}>
        Not available
      </span>
    )
  }
  if (!src) return <span aria-hidden className={`block animate-pulse bg-mist ${className}`} />
  return <img src={src} alt={alt} className={className} {...rest} />
}
