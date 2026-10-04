import { Link } from 'react-router-dom'
import { photos } from '../data/sample.ts'

export default function Gallery() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl">Photos</h1>
        <p className="mt-2 text-gray-700">
          {photos.length} photos, 1990 to 1996. Open one to see who is in it, or to add a name.
        </p>
      </div>

      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo) => {
          const confirmed = photo.tags.filter((t) => t.status === 'confirmed').length
          const pending = photo.tags.length - confirmed
          return (
            <li key={photo.id}>
              <Link
                to={`/photos/${photo.id}`}
                className="group block overflow-hidden rounded-xl border border-gray-200 no-underline transition hover:border-pink hover:shadow-md"
              >
                <img src={photo.src} alt={photo.title} className="aspect-[4/3] w-full object-cover" />
                <div className="p-4">
                  <h2 className="text-xl group-hover:text-pink-deep">{photo.title}</h2>
                  <p className="font-sans text-sm text-gray-600">
                    {photo.year}. {photo.place}.
                  </p>
                  <p className="mt-2 font-sans text-sm text-navy">
                    {confirmed} named{pending > 0 ? `, ${pending} awaiting confirmation` : ''}
                  </p>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
