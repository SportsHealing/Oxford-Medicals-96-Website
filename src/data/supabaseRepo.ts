import type { SupabaseClient } from '@supabase/supabase-js'
import { makeThumbnail } from '../lib/prepareImage.ts'
import type { AdminMember, InboxMessage, InviteResult, Member, Photo, ProfileInput, Repo, Tag } from './types.ts'

// Column list for members. Never select '*': email is deliberately not
// readable by other members (see migration 0002).
const MEMBER_COLS =
  'id, full_name, known_as, college, job_title, workplace, career_path, interests, clinical_training, memory, tingewick, linkedin, website, instagram, twitter, accepts_contact, allows_tags, is_admin, avatar_path'

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
  website: string | null
  instagram: string | null
  twitter: string | null
  accepts_contact: boolean
  allows_tags: boolean
  is_admin: boolean
  avatar_path: string | null
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
  thumb_path: string | null
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
  website: r.website,
  instagram: r.instagram,
  twitter: r.twitter,
  acceptsContact: r.accepts_contact,
  allowsTags: r.allows_tags,
  isAdmin: r.is_admin,
})

const AVATAR_URL_SECONDS = 60 * 60

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

// Keeps a list for a few minutes so moving between pages does not refetch
// everything (and re-sign every photo link) each time.
const CACHE_MS = 3 * 60 * 1000
function memo<T>(load: () => Promise<T>) {
  let hit: { at: number; value: Promise<T> } | null = null
  return {
    get() {
      if (hit && Date.now() - hit.at < CACHE_MS) return hit.value
      const value = load()
      hit = { at: Date.now(), value }
      value.catch(() => {
        if (hit?.value === value) hit = null
      })
      return value
    },
    clear() {
      hit = null
    },
  }
}

export function createSupabaseRepo(client: SupabaseClient): Repo {
  const fail = (error: { message: string } | null) => {
    if (error) throw new Error(error.message)
  }

  const withUrls = async (rows: PhotoRow[]): Promise<Photo[]> => {
    if (rows.length === 0) return []
    const { data, error } = await client.storage
      .from('photos')
      .createSignedUrls(
        rows.flatMap((r) => (r.thumb_path ? [r.storage_path, r.thumb_path] : [r.storage_path])),
        SIGNED_URL_SECONDS,
      )
    fail(error)
    const urlByPath = new Map((data ?? []).map((d) => [d.path, d.signedUrl]))
    return rows.map((r) => {
      const src = urlByPath.get(r.storage_path) ?? ''
      return {
        id: r.id,
        title: r.title,
        year: r.year,
        place: r.place,
        caption: r.caption,
        src,
        thumb: (r.thumb_path && urlByPath.get(r.thumb_path)) || src,
        uploadedBy: r.uploaded_by,
        tags: (r.photo_tags ?? []).map(toTag),
      }
    })
  }

  const withAvatars = async (rows: MemberRow[]): Promise<Member[]> => {
    const paths = rows.map((r) => r.avatar_path).filter((p): p is string => Boolean(p))
    let urlByPath = new Map<string, string>()
    if (paths.length) {
      const { data } = await client.storage.from('avatars').createSignedUrls(paths, AVATAR_URL_SECONDS)
      urlByPath = new Map((data ?? []).flatMap((d) => (d.path && d.signedUrl ? [[d.path, d.signedUrl]] : [])))
    }
    return rows.map((r) => ({ ...toMember(r), avatarUrl: r.avatar_path ? urlByPath.get(r.avatar_path) ?? null : null }))
  }

  const me = async () => {
    const { data } = await client.auth.getUser()
    const id = data.user?.id
    if (!id) throw new Error('Not signed in')
    return id
  }

  const photosCache = memo(async () => {
    const { data, error } = await client
      .from('photos')
      .select('id, title, year, place, caption, storage_path, thumb_path, uploaded_by, photo_tags(*)')
      .order('year', { ascending: true, nullsFirst: false })
      .order('created_at')
    fail(error)
    return withUrls((data ?? []) as unknown as PhotoRow[])
  })
  const membersCache = memo(async () => {
    const { data, error } = await client.from('members').select(MEMBER_COLS).order('full_name')
    fail(error)
    return withAvatars((data ?? []) as unknown as MemberRow[])
  })
  client.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
      photosCache.clear()
      membersCache.clear()
    }
  })

  return {
    listMembers: () => membersCache.get(),
    async getMember(id) {
      const { data, error } = await client.from('members').select(MEMBER_COLS).eq('id', id).maybeSingle()
      fail(error)
      if (!data) return null
      const [m] = await withAvatars([data as unknown as MemberRow])
      return m
    },
    async setAvatar(file) {
      membersCache.clear()
      const uid = await me()
      const { data: cur } = await client.from('members').select('avatar_path').eq('id', uid).maybeSingle()
      const path = `${uid}/${Date.now()}.jpg`
      const up = await client.storage.from('avatars').upload(path, file, { contentType: file.type || 'image/jpeg' })
      fail(up.error)
      const { error } = await client.from('members').update({ avatar_path: path }).eq('id', uid)
      if (error) {
        await client.storage.from('avatars').remove([path])
        fail(error)
      }
      if (cur?.avatar_path) await client.storage.from('avatars').remove([cur.avatar_path])
    },
    async removeAvatar() {
      const uid = await me()
      const { data: cur } = await client.from('members').select('avatar_path').eq('id', uid).maybeSingle()
      const { error } = await client.from('members').update({ avatar_path: null }).eq('id', uid)
      fail(error)
      if (cur?.avatar_path) await client.storage.from('avatars').remove([cur.avatar_path])
    },
    listPhotos: () => photosCache.get(),
    async getPhoto(id) {
      const { data, error } = await client
        .from('photos')
        .select('id, title, year, place, caption, storage_path, thumb_path, uploaded_by, photo_tags(*)')
        .eq('id', id)
        .maybeSingle()
      fail(error)
      if (!data) return null
      const [photo] = await withUrls([data as unknown as PhotoRow])
      return photo
    },
    async suggestTag(photoId, memberId, x, y) {
      photosCache.clear()
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
      photosCache.clear()
      const { error } = await client.from('photo_tags').update({ status }).eq('id', tagId)
      fail(error)
    },
    async removeTag(tagId) {
      photosCache.clear()
      const { error } = await client.from('photo_tags').delete().eq('id', tagId)
      fail(error)
    },
    async myPendingTags() {
      const id = await me()
      const { data, error } = await client
        .from('photo_tags')
        .select('*, photos(id, title, year, place, caption, storage_path, thumb_path, uploaded_by)')
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
      membersCache.clear()
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
          website: input.website ?? null,
          instagram: input.instagram ?? null,
          twitter: input.twitter ?? null,
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
      photosCache.clear()
      const uid = await me()
      const ext = (input.file.name.split('.').pop() || 'jpg').toLowerCase()
      const path = `${uid}/${crypto.randomUUID()}.${ext}`
      const thumb = await makeThumbnail(input.file)
      const thumbPath = thumb ? `${uid}/${crypto.randomUUID()}-thumb.jpg` : null
      const [up, thumbUp] = await Promise.all([
        client.storage.from('photos').upload(path, input.file, { contentType: input.file.type }),
        thumb && thumbPath ? client.storage.from('photos').upload(thumbPath, thumb, { contentType: 'image/jpeg' }) : null,
      ])
      fail(up.error)
      // A missing thumbnail is not worth failing the upload over.
      const savedThumb = thumbUp && !thumbUp.error ? thumbPath : null
      const { data, error } = await client
        .from('photos')
        .insert({
          title: input.title,
          year: input.year || null,
          place: input.place || null,
          caption: input.caption || null,
          storage_path: path,
          thumb_path: savedThumb,
          uploaded_by: uid,
        })
        .select('id')
        .single()
      if (error) {
        await client.storage.from('photos').remove(savedThumb ? [path, savedThumb] : [path])
        fail(error)
      }
      return (data as { id: string }).id
    },
    async deletePhoto(photoId) {
      photosCache.clear()
      const { data, error } = await client.from('photos').select('storage_path, thumb_path').eq('id', photoId).maybeSingle()
      fail(error)
      const del = await client.from('photos').delete().eq('id', photoId)
      fail(del.error)
      const files = [data?.storage_path, data?.thumb_path].filter((f): f is string => Boolean(f))
      if (files.length) await client.storage.from('photos').remove(files)
    },
    async listAllowedEmails() {
      const { data, error } = await client.from('allowed_emails').select('email, note, invite_sent_at').order('email')
      fail(error)
      type Row = { email: string; note: string | null; invite_sent_at: string | null }
      return ((data ?? []) as Row[]).map((r) => ({ email: r.email, note: r.note, inviteSentAt: r.invite_sent_at }))
    },
    async addAllowedEmails(emails, note) {
      const rows = emails.map((email) => ({ email: email.trim().toLowerCase(), note: note ?? null }))
      const { error } = await client.from('allowed_emails').upsert(rows, { onConflict: 'email' })
      fail(error)
    },
    async sendInvites(input) {
      const { data, error } = await client.functions.invoke('send-invites', { body: input })
      if (error) {
        // Surface the function's own message where there is one.
        if (error.name === 'FunctionsFetchError') {
          throw new Error(
            'Could not reach the send-invites function. Check it is deployed in Supabase (Edge Functions) with exactly that name.',
          )
        }
        let detail = error.message
        try {
          const ctx = (error as { context?: Response }).context
          const j = ctx ? await ctx.json() : null
          if (j?.error) detail = j.error
        } catch {
          /* keep the generic message */
        }
        throw new Error(detail)
      }
      return data as InviteResult
    },
    async removeAllowedEmail(email) {
      const { error } = await client.from('allowed_emails').delete().eq('email', email)
      fail(error)
    },
    async setAdmin(memberId, makeAdmin) {
      membersCache.clear()
      const { error } = await client.rpc('set_admin', { target: memberId, make_admin: makeAdmin })
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
