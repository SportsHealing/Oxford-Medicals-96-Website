import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-10 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 text-4xl">Not found</h1>
      <p className="mt-3 text-muted">That page does not exist, or has been taken down.</p>
      <Link to="/" className="btn-outline mt-6">
        Back to the front page
      </Link>
    </div>
  )
}
