import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="space-y-4">
      <h1 className="text-4xl">Not found</h1>
      <p className="text-gray-700">That page does not exist, or has been taken down.</p>
      <Link to="/">Back to the front page</Link>
    </div>
  )
}
