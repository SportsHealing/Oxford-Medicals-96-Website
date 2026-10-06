import type { SupabaseClient } from '@supabase/supabase-js'
import type { AdminMember, InboxMessage, Member, Photo, ProfileInput, Repo, Tag } from './types.ts'

// Column list for members. Never select '*': email is deliberately not
// readable by other members (see migration 0002).
const MEMBER_COLS =
  'id, full_name, known_as, college, job_title, workplace, career_path, interests, clinical_training, memory, tingewick, linkedin, accepts_contact, allows_tags, is_admin'

type MemberRow = {
  id: string
  full_name: string
  known_as: string | null
  college: string | null
  job_title: string | null
  workplace: string | null
  career_path: string | null
  interests: string | null
  clinical_training: string | null
  memory: string | null
  tingewick: string | null
  linkedin: string | null
  accepts_contact: boolean
  allows_tags: boolean
  is_admin: boolean
}

type TagRow = {
  id: string
  photo_id: string
  member_id: string
  x: number | string
  y: number | string
  status: Tag['status']
  suggested_by: string | null
}

type PhotoRow = {
  id: string
  title: string
  year: string | null
  place: string | null
  caption: string | null
  storage_path: string
  uploaded_by: string | null
  photo_tags: TagRow[]
}

const toMember = (r: MemberRow): Member => ({
  id: r.id,
  name: r.full_name || 'Unnamed member',
  knownAs: r.known_as,
  college: r.college,
  jobTitle: r.job_title,
  workplace: r.workplace,
  careerPath: r.career_path,
  interests: r.interests,
  clinicalTraining: r.clinical_training,
  memory: r.memory,
  tingewick: r.tingewick,
  linkedin: r.linkedin,
  acceptsContact: r.accepts_contact,
  allowsTags: r.allows_tags,
  isAdmin: r.is_admin,
})

const toTag = (t: TagRow): Tag => ({
  id: t.id,
  photoId: t.photo_id,
  memberId: t.member_id,
  x: Number(t.x),
  y: Number(t.y),
  status: t.status,
  suggestedBy: t.suggested_by,
})

const SIGNED_URL_SECONDS = 15 * 60

export function createSupabaseRepo(client: SupabaseClient): Repo {
  const fail = (error: { message: string } | null) => {
    if (error) throw new Error(error.message)
  }

  const withUrls = async (rows: PhotoRow[]): Promise<Photo[]> => {
    if (rows.length === 0) return []
    const { data, error } = await client.storage
      .from('photos')
      .createSignedUrls(
        rows.map((r) => r.storage_path),
        SIGNED_URL_SECONDS,
      )
    fail(error)
    const urlByPath = new Map((data ?? []).map((d) => [d.path, d.signedUrl]))
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      year: r.year,
      place: r.place,
      caption: r.caption,
      src: urlByPath.get(r.storage_path) ?? '',
      uploadedBy: r.uploaded_by,
      tags: (r.photo_tags ?? []).map(toTag),
    }))
  }

  const me = async () => {
    const { data } = await client.auth.getUser()
    const id = data.user?.id
    if (!id) throw new Error('Not signed in')
    return id
  }

  return {
    async listMembers() {
      const { data, error } = await client.from('members').select(MEMBER_COLS).order('full_name')
      fail(error)
      return ((data ?? []) as unknown as MemberRow[]).map(toMember)
    },
    async getMember(id) {
      const { data, error } = await client.from('members').select(MEMBER_COLS).eq('id', id).maybeSingle()
      fail(error)
      return data ? toMember(data as unknown as MemberRow) : null
    },
    async listPhotos() {
      const { data, error } = await client
        .from('photos')
        .select('id, title, year, place, caption, storage_path, uploaded_by, photo_tags(*)')
        .order('year', { ascending: true, nullsFirst: false })
        .order('created_at')
      fail(error)
      return withUrls((data ?? []) as unknown as PhotoRow[])
    },
    async getPhoto(id) {
      const { data, error } = await client
        .from('photos')
        .select('id, title, year, place, caption, storage_path, uploaded_by, photo_tags(*)')
        .eq('id', id)
        .maybeSingle()
      fail(error)
      if (!data) return null
      const [photo] = await withUrls([data as unknown as PhotoRow])
      return photo
    },
    async suggestTag(photoId, memberId, x, y) {
      const uid = await me()
      const { error } = await client.from('photo_tags').insert({
        photo_id: photoId,
        member_id: memberId,
        x,
        y,
        // Tagging yourself needs no confirmation.
        status: memberId === uid ? 'confirmed' : 'pending',
        suggested_by: uid,
      })
      fail(error)
    },
    async decideTag(tagId, status) {
      const { error } = await client.from('photo_tags').update({ status }).eq('id', tagId)
      fail(error)
    },
    async removeTag(tagId) {
      const { error } = await client.from('photo_tags').delete().eq('id', tagId)
      fail(error)
    },
    async myPendingTags() {
      const id = await me()
      const { data, error } = await client
        .from('photo_tags')
        .select('*, photos(id, title, year, place, caption, storage_path, uploaded_by)')
        .eq('member_id', id)
        .eq('status', 'pending')
      fail(error)
      type Row = TagRow & { photos: Omit<PhotoRow, 'photo_tags'> | null }
      const rows = (data ?? []) as unknown as Row[]
      const photoRows = rows.flatMap((r) => (r.photos ? [{ ...r.photos, photo_tags: [] }] : []))
      const photos = await withUrls(photoRows)
      const byId = new Map(photos.map((p) => [p.id, p]))
      return rows.flatMap((r) => {
        const photo = r.photos && byId.get(r.photos.id)
        return photo ? [{ tag: toTag(r), photo }] : []
      })
    },
    async myEmail() {
      const { data, error } = await client.rpc('my_email')
      fail(error)
      return (data as string | null) ?? null
    },
    async updateProfile(input: ProfileInput) {
      const { error } = await client
        .from('members')
        .update({
          full_name: input.name,
          known_as: input.knownAs ?? null,
          college: input.college ?? null,
          job_title: input.jobTitle ?? null,
          workplace: input.workplace ?? null,
          career_path: input.careerPath ?? null,
          interests: input.interests ?? null,
          clinical_training: input.clinicalTraining ?? null,
          memory: input.memory ?? null,
          tingewick: input.tingewick ?? null,
          linkedin: input.linkedin ?? null,
          accepts_contact: input.acceptsContact,
          allows_tags: input.allowsTags,
        })
        .eq('id', await me())
      fail(error)
    },
    async sendContact(toMemberId, message) {
      const { error } = await client
        .from('contact_requests')
        .insert({ from_member: await me(), to_member: toMemberId, message })
      fail(error)
    },
    async inbox() {
      const { data, error } = await client.rpc('contact_inbox')
      fail(error)
      type Row = { id: string; message: string; created_at: string; from_id: string; from_name: string; from_email: string }
      return ((data ?? []) as Row[]).map(
        (r): InboxMessage => ({
          id: r.id,
          message: r.message,
          createdAt: r.created_at,
          fromId: r.from_id,
          fromName: r.from_name || 'A classmate',
          fromEmail: r.from_email,
        }),
      )
    },
    async addPhoto(input) {
      const uid = await me()
      const ext = (input.file.name.split('.').pop() || 'jpg').toLowerCase()
      const path = `${uid}/${crypto.randomUUID()}.${ext}`
      const up = await client.storage.from('photos').upload(path, input.file, { contentType: input.file.type })
      fail(up.error)
      const { data, error } = await client
        .from('photos')
        .insert({
          title: input.title,
          year: input.year || null,
          place: input.place || null,
          caption: input.caption || null,
          storage_path: path,
          uploaded_by: uid,
        })
        .select('id')
        .single()
      if (error) {
        await client.storage.from('photos').remove([path])
        fail(error)
      }
      return (data as { id: string }).id
    },
    async deletePhoto(photoId) {
      const { data, error } = await client.from('photos').select('storage_path').eq('id', photoId).maybeSingle()
      fail(error)
      const del = await client.from('photos').delete().eq('id', photoId)
      fail(del.error)
      if (data?.storage_path) await client.storage.from('photos').remove([data.storage_path])
    },
    async listAllowedEmails() {
      const { data, error } = await client.from('allowed_emails').select('email, note').order('email')
      fail(error)
      return (data ?? []) as { email: string; note: string | null }[]
    },
    async addAllowedEmails(emails, note) {
      const rows = emails.map((email) => ({ email: email.trim().toLowerCase(), note: note ?? null }))
      const { error } = await client.from('allowed_emails').upsert(rows, { onConflict: 'email' })
      fail(error)
    },
    async removeAllowedEmail(email) {
      const { error } = await client.from('allowed_emails').delete().eq('email', email)
      fail(error)
    },
    async adminMembers() {
      const { data, error } = await client.rpc('admin_members')
      fail(error)
      type Row = { id: string; email: string; full_name: string; is_admin: boolean; created_at: string }
      return ((data ?? []) as Row[]).map(
        (r): AdminMember => ({ id: r.id, email: r.email, name: r.full_name, isAdmin: r.is_admin, createdAt: r.created_at }),
      )
    },
  }
}
