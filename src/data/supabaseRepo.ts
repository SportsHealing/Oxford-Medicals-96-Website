import type { SupabaseClient } from '@supabase/supabase-js'
import { makeThumbnail } from '../lib/prepareImage.ts'
import type {
  AdminMember,
  DecisionResult,
  ImportSummary,
  InboxMessage,
  InviteResult,
  JoinRequest,
  Member,
  Photo,
  ProfileInput,
  PublicLinks,
  Repo,
  RosterPerson,
  Tag,
  Speech,
  SpeechQuote,
  SpeechSummary,
} from './types.ts'

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
  previous_name?: string | null
  specialty?: string | null
  show_email?: boolean
  town?: string | null
  country?: string | null
  lat?: number | null
  lng?: number | null
  links?: PublicLinks | null
}

// Added by migration 0011. Until it has run, members are read without them.
const EXTRA_COLS = 'previous_name, specialty, show_email, town, country, lat, lng, links'

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
  previousName: r.previous_name ?? null,
  specialty: r.specialty ?? null,
  showEmail: r.show_email ?? false,
  town: r.town ?? null,
  country: r.country ?? null,
  lat: r.lat ?? null,
  lng: r.lng ?? null,
  links: r.links ?? {},
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

  // Storage signs at most 1000 paths per request, so ask in batches.
  const signAll = async (bucket: string, paths: string[], seconds: number) => {
    const batches: string[][] = []
    for (let i = 0; i < paths.length; i += 500) batches.push(paths.slice(i, i + 500))
    const results = await Promise.all(batches.map((b) => client.storage.from(bucket).createSignedUrls(b, seconds)))
    const urlByPath = new Map<string, string>()
    for (const { data, error } of results) {
      fail(error)
      for (const d of data ?? []) if (d.path && d.signedUrl) urlByPath.set(d.path, d.signedUrl)
    }
    return urlByPath
  }

  // Calls an Edge Function, surfacing its own error message where there is one.
  const invoke = async (name: string, body: Record<string, unknown>): Promise<unknown> => {
    const { data, error } = await client.functions.invoke(name, { body })
    if (!error) return data
    if (error.name === 'FunctionsFetchError') {
      throw new Error(
        `Could not reach the ${name} function. Check it is deployed in Supabase (Edge Functions) with exactly that name.`,
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

  const withUrls = async (rows: PhotoRow[]): Promise<Photo[]> => {
    if (rows.length === 0) return []
    const urlByPath = await signAll(
      'photos',
      rows.flatMap((r) => (r.thumb_path ? [r.storage_path, r.thumb_path] : [r.storage_path])),
      SIGNED_URL_SECONDS,
    )
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
    // A missing profile picture should not stop the directory loading.
    const urlByPath = paths.length
      ? await signAll('avatars', paths, AVATAR_URL_SECONDS).catch(() => new Map<string, string>())
      : new Map<string, string>()
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
  // Before database update 0012 runs there are simply no speeches.
  const missingTable = (e: { code?: string; message: string } | null) =>
    Boolean(e) && (e!.code === '42P01' || e!.code === 'PGRST205' || /relation .* does not exist|could not find the table/i.test(e!.message))
  // pdf_name arrives with database update 0013; until then there are no PDFs.
  let hasPdfs = true
  const SPEECH_COLS = 'id, slug, title, speaker, occasion'
  const readSpeeches = async <T>(cols: string, run: (cols: string) => PromiseLike<{ data: T | null; error: { code?: string; message: string } | null }>) => {
    if (hasPdfs) {
      const res = await run(`${cols}, pdfName:pdf_name`)
      if (!missingColumn(res.error)) return res
      hasPdfs = false
    }
    return run(cols)
  }
  const speechesCache = memo(async (): Promise<SpeechSummary[]> => {
    const { data, error } = await readSpeeches(SPEECH_COLS, (cols) =>
      client.from('speeches').select(cols).order('sort').order('created_at'),
    )
    if (missingTable(error)) return []
    fail(error)
    return (data ?? []) as unknown as SpeechSummary[]
  })
  const quotesCache = memo(async (): Promise<SpeechQuote[]> => {
    const { data, error } = await client
      .from('speech_quotes')
      .select('id, text, attribution, sort, speeches(slug, title, speaker, sort)')
    if (missingTable(error)) return []
    fail(error)
    type Row = { id: string; text: string; attribution: string | null; sort: number; speeches: { slug: string; title: string; speaker: string | null; sort: number } | null }
    return ((data ?? []) as unknown as Row[])
      .filter((r) => r.speeches)
      .sort((a, b) => a.sort - b.sort || a.speeches!.sort - b.speeches!.sort)
      .map((r) => ({
        id: r.id,
        text: r.text,
        attribution: r.attribution || r.speeches!.speaker || '',
        speechSlug: r.speeches!.slug,
        speechTitle: r.speeches!.title,
      }))
  })
  // null until we know whether migration 0011 has run.
  let hasExtras: boolean | null = null
  const missingColumn = (e: { code?: string; message: string } | null) =>
    Boolean(e) && (e!.code === '42703' || /column .* does not exist/i.test(e!.message))
  const readMembers = async (filterId?: string) => {
    const run = (cols: string) => {
      const q = client.from('members').select(cols)
      return filterId ? q.eq('id', filterId) : q.order('full_name')
    }
    if (hasExtras !== false) {
      const res = await run(`${MEMBER_COLS}, ${EXTRA_COLS}`)
      if (!missingColumn(res.error)) {
        hasExtras = true
        fail(res.error)
        return (res.data ?? []) as unknown as MemberRow[]
      }
      hasExtras = false
    }
    const res = await run(MEMBER_COLS)
    fail(res.error)
    return (res.data ?? []) as unknown as MemberRow[]
  }
  // Emails of members who chose to show them.
  const shownEmails = async () => {
    const { data, error } = await client.rpc('member_contact_emails')
    if (error) return new Map<string, string>()
    return new Map(((data ?? []) as { id: string; email: string }[]).map((d) => [d.id, d.email]))
  }
  const withExtras = async (rows: MemberRow[]) => {
    const [members, emails] = await Promise.all([withAvatars(rows), shownEmails()])
    return members.map((m) => ({ ...m, email: emails.get(m.id) ?? null }))
  }

  const membersCache = memo(async () => withExtras(await readMembers()))
  client.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
      photosCache.clear()
      membersCache.clear()
    }
  })

  return {
    listMembers: () => membersCache.get(),
    hasProfileExtras: () => hasExtras !== false,
    async getMember(id) {
      const rows = await readMembers(id)
      if (rows.length === 0) return null
      const [m] = await withExtras(rows)
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
    listSpeeches: () => speechesCache.get(),
    async getSpeech(slug) {
      const { data, error } = await readSpeeches(`${SPEECH_COLS}, body`, (cols) =>
        client.from('speeches').select(cols).eq('slug', slug).maybeSingle(),
      )
      if (missingTable(error)) return null
      fail(error)
      return (data as unknown as Speech | null) ?? null
    },
    async getSpeechPdf(slug) {
      const { data, error } = await client.from('speeches').select('pdf_name, pdf_base64').eq('slug', slug).maybeSingle()
      if (missingTable(error) || missingColumn(error)) return null
      fail(error)
      if (!data?.pdf_base64) return null
      const bytes = Uint8Array.from(atob(data.pdf_base64), (c) => c.charCodeAt(0))
      return { name: data.pdf_name || `${slug}.pdf`, blob: new Blob([bytes], { type: 'application/pdf' }) }
    },
    listSpeechQuotes: () => quotesCache.get(),
    async listFeaturedPhotos() {
      const { data, error } = await client
        .from('photos')
        .select('id, title, year, place, caption, storage_path, thumb_path, uploaded_by, photo_tags(*)')
        .not('featured_rank', 'is', null)
        .order('featured_rank')
      if (missingColumn(error)) return []
      fail(error)
      return withUrls((data ?? []) as unknown as PhotoRow[])
    },
    async setFeatured(photoId, rank) {
      const { error } = await client.from('photos').update({ featured_rank: rank }).eq('id', photoId)
      if (missingColumn(error)) throw new Error('Run database update 0011 first (Supabase, SQL Editor).')
      fail(error)
    },
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
      if (hasExtras === false) return
      const extra = await client
        .from('members')
        .update({
          previous_name: input.previousName || null,
          specialty: input.specialty || null,
          show_email: input.showEmail ?? false,
          town: input.town || null,
          country: input.country || null,
          lat: input.lat ?? null,
          lng: input.lng ?? null,
          links: input.links ?? {},
        })
        .eq('id', await me())
      if (missingColumn(extra.error)) hasExtras = false
      else fail(extra.error)
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
      return (await invoke('send-invites', { ...input })) as InviteResult
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
    async listJoinRequests() {
      const { data, error } = await client.from('join_requests').select('*').order('created_at', { ascending: false })
      fail(error)
      type Row = {
        id: string; user_id: string; email: string; full_name: string; previous_name: string | null
        kind: JoinRequest['kind']; matched_name: string | null; status: JoinRequest['status']; created_at: string; decided_at: string | null
      }
      return ((data ?? []) as Row[]).map((r) => ({
        id: r.id, userId: r.user_id, email: r.email, fullName: r.full_name, previousName: r.previous_name, kind: r.kind,
        matchedName: r.matched_name, status: r.status, createdAt: r.created_at, decidedAt: r.decided_at,
      }))
    },
    async decideJoinRequest(id, accept, message) {
      return (await invoke('join-requests', { action: 'decide', id, accept, message })) as DecisionResult
    },
    async deleteJoinRequest(id) {
      const { error } = await client.from('join_requests').delete().eq('id', id)
      fail(error)
    },
    async listRoster() {
      const { data, error } = await client.from('roster').select('*').order('full_name')
      fail(error)
      type Row = {
        id: string; full_name: string; other_names: string[]; email: string | null; specialty: string | null
        cohort: RosterPerson['cohort']; member_id: string | null; joined_by_name: boolean
      }
      return ((data ?? []) as Row[]).map((r) => ({
        id: r.id, fullName: r.full_name, otherNames: r.other_names ?? [], email: r.email, specialty: r.specialty,
        cohort: r.cohort, memberId: r.member_id, joinedByName: r.joined_by_name,
      }))
    },
    async importPeople(rows) {
      const { data, error } = await client.rpc('admin_import_people', { p_rows: rows })
      fail(error)
      const d = data as { added: number; linked: number; already_known: number; emails_added: number; to_check: string[] }
      membersCache.clear()
      return { added: d.added, linked: d.linked, alreadyKnown: d.already_known, emailsAdded: d.emails_added, toCheck: d.to_check ?? [] } satisfies ImportSummary
    },
    async removeAccess(memberId) {
      const { error } = await client.rpc('admin_remove_access', { p_member: memberId })
      fail(error)
      membersCache.clear()
    },
    async unrecognisedSignins() {
      const { data, error } = await client.rpc('admin_unrecognised_signins')
      fail(error)
      type Row = { email: string; first_tried: string; signed_in: boolean }
      return ((data ?? []) as Row[]).map((r) => ({ email: r.email, firstTried: r.first_tried, signedIn: r.signed_in }))
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
