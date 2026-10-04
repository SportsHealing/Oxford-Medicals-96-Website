import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth.tsx'
import { personById } from '../data/sample.ts'
import NotFound from './NotFound.tsx'

export default function Contact() {
  const { id } = useParams()
  const { email } = useAuth()
  const person = id ? personById(id) : undefined
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  if (!person) return <NotFound />
  if (!person.acceptsContact) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="text-3xl">{person.name} is not taking contact requests</h1>
        <Link to={`/classmates/${person.id}`}>Back to their profile</Link>
      </div>
    )
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Link to={`/classmates/${person.id}`} className="font-sans text-sm">
        &larr; {person.name}
      </Link>
      <h1 className="text-4xl">Get in touch with {person.knownAs ?? person.name}</h1>

      {sent ? (
        <div className="rounded-xl bg-blush p-6">
          <h2 className="text-2xl">Sent</h2>
          <p className="mt-2 text-gray-700">
            Your message has gone to {person.name}. They will see your email address ({email}) and can
            reply directly. We do not show their address to you.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <p className="text-gray-700">
            Your message and your email address go to {person.name}. Their address stays private
            unless they reply.
          </p>
          <label className="block">
            <span className="font-sans font-semibold text-navy">Message</span>
            <textarea
              required
              rows={5}
              className="field mt-1"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hello. Long time. Are you going to the reunion?"
            />
          </label>
          <button type="submit" className="btn-pink">
            Send
          </button>
        </form>
      )}
    </div>
  )
}
