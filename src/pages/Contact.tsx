import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import Avatar from '../components/Avatar.tsx'
import { useAuth } from '../auth.tsx'
import { repo } from '../data/repo.ts'
import { LoadError, Loading, useLoad } from '../lib/useLoad.tsx'
import NotFound from './NotFound.tsx'

export default function Contact() {
  const { id = '' } = useParams()
  const { email } = useAuth()
  const { data: person, loading, error } = useLoad(() => repo.getMember(id), [id])
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  if (loading) return <Loading />
  if (error) return <LoadError message={error} />
  if (!person) return <NotFound />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setProblem(null)
    try {
      await repo.sendContact(person.id, message.trim())
      setSent(true)
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'Could not send the message')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Link to={`/classmates/${person.id}`} className="mb-6 inline-block font-sans text-sm text-muted no-underline hover:text-navy">
        &larr; {person.name}
      </Link>

      <div className="card p-8 sm:p-10">
        <div className="flex items-center gap-4">
          <Avatar name={person.name} src={person.avatarUrl} />
          <div>
            <p className="label-caps">Message to</p>
            <p className="font-serif text-xl text-navy">{person.name}</p>
          </div>
        </div>

        {!person.acceptsContact ? (
          <p className="mt-6 text-muted">{person.name} is not taking messages at the moment.</p>
        ) : sent ? (
          <div className="mt-6">
            <h1 className="text-2xl">Sent</h1>
            <p className="mt-2 text-muted">
              Your message is waiting for {person.name} on their profile page. They will see your
              email address ({email}) and can reply directly. Their address stays private.
            </p>
            <Link to={`/classmates/${person.id}`} className="btn-quiet mt-6 -ml-4">
              Back to their profile
            </Link>
          </div>
        ) : (
          <form onSubmit={(e) => void submit(e)} className="mt-6 space-y-5">
            <label className="block">
              <span className="label-caps">Your message</span>
              <textarea
                required
                rows={5}
                maxLength={2000}
                className="field mt-1.5"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hello. Long time. Are you going to the reunion?"
              />
            </label>
            <p className="font-sans text-sm text-muted">
              {person.name} will see your message and your email address. Their address stays private
              unless they reply.
            </p>
            {problem && <p className="font-sans text-sm text-pink-deep">{problem}</p>}
            <button type="submit" className="btn-primary w-full" disabled={busy || !message.trim()}>
              {busy ? 'Sending…' : 'Send message'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
