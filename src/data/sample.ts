// Sample data and an in-memory repo for prototype mode.
// Every person and photo here is fictional.
import { asset } from '../asset.ts'
import type { AllowedEmail, InboxMessage, JoinRequest, Member, Photo, ProfileInput, Repo, RosterPerson, Speech, SpeechQuote, Tag } from './types.ts'

/** In prototype mode you are signed in as this person. */
export const SAMPLE_ME = 'sample-alder'

export const members: Member[] = [
  {
    id: 'sample-alder',
    name: 'Sample Alder',
    knownAs: 'Sam',
    college: 'Balliol',
    clinicalTraining: 'John Radcliffe Hospital',
    memory: 'Revision picnics in the Parks that turned into cricket.',
    tingewick: 'Chorus, 1994. Sang flat but with feeling.',
    jobTitle: 'Consultant Cardiologist',
    workplace: 'Royal Berkshire Hospital, Reading',
    careerPath: 'Trained in Oxford and London. Consultant since 2009. Clinical lead for heart failure.',
    interests: 'Sailing, choral singing, bad puns.',
    linkedin: 'https://www.linkedin.com/',
    website: 'samalder.example.com',
    instagram: '@sam_sails',
    acceptsContact: true,
    allowsTags: true,
    isAdmin: true,
  },
  {
    id: 'sample-birch',
    name: 'Sample Birch',
    college: 'Somerville',
    clinicalTraining: 'Oxford, then Northampton',
    memory: 'The night the Osler House bar ran out of everything except lime cordial.',
    tingewick: 'Wrote half the script in 1995. The good half, obviously.',
    jobTitle: 'GP Partner',
    workplace: 'Headington, Oxford',
    careerPath: 'GP training in Oxford. Partner since 2004. Trains GP registrars.',
    interests: 'Allotment, running, crime novels.',
    acceptsContact: true,
    allowsTags: true,
    isAdmin: false,
  },
  {
    id: 'sample-cedar',
    name: 'Sample Cedar',
    knownAs: 'Ced',
    college: 'Magdalen',
    clinicalTraining: 'John Radcliffe Hospital',
    memory: 'Anatomy vivas. Still have dreams about the brachial plexus.',
    tingewick: 'Lighting. Never on stage, always in the dark.',
    jobTitle: 'Professor of Neurology',
    workplace: 'University of Edinburgh',
    careerPath: 'PhD in Cambridge, then neurology in Edinburgh. Runs a research group on movement disorders.',
    interests: 'Hillwalking, jazz piano.',
    linkedin: 'https://www.linkedin.com/',
    acceptsContact: true,
    allowsTags: true,
    isAdmin: false,
  },
  {
    id: 'sample-elm',
    name: 'Sample Elm',
    college: 'St Hugh’s',
    clinicalTraining: 'Oxford and Stoke Mandeville',
    memory: 'Finals week. Sunshine, nerves, and far too much coffee.',
    tingewick: 'Not involved, but never missed a show.',
    jobTitle: 'Consultant Anaesthetist',
    workplace: 'Auckland City Hospital, New Zealand',
    careerPath: 'Moved to New Zealand in 2003 for a year. Still there.',
    interests: 'Surfing, baking bread.',
    acceptsContact: false,
    allowsTags: true,
    isAdmin: false,
  },
  {
    id: 'sample-hazel',
    name: 'Sample Hazel',
    college: 'Keble',
    clinicalTraining: 'John Radcliffe Hospital',
    memory: 'Rowing at dawn, lectures at nine, asleep by ten.',
    tingewick: 'Played the Dame in 1995.',
    jobTitle: 'Medical Director',
    workplace: 'A health technology company, London',
    careerPath: 'Left clinical practice in 2015. Now leads clinical safety for a digital health firm.',
    interests: 'Cycling, theatre, cooking for crowds.',
    linkedin: 'https://www.linkedin.com/',
    acceptsContact: true,
    allowsTags: true,
    isAdmin: false,
  },
  {
    id: 'sample-linden',
    name: 'Sample Linden',
    college: 'New College',
    clinicalTraining: 'Oxford, then Milton Keynes',
    memory: 'Freshers’ week in 1990. Lost in the Radcliffe Camera within an hour.',
    tingewick: 'Front of house, three years running.',
    jobTitle: 'Consultant Paediatrician',
    workplace: 'Bristol Royal Hospital for Children',
    careerPath: 'Paediatrics in Bristol since 2001. Special interest in respiratory medicine.',
    interests: 'Gardening, birdwatching, family.',
    acceptsContact: true,
    allowsTags: false,
    isAdmin: false,
  },
  {
    id: 'sample-rowan',
    name: 'Sample Rowan',
    knownAs: 'Ro',
    college: 'Wadham',
    clinicalTraining: 'John Radcliffe Hospital',
    memory: 'Tingewick rehearsals that lasted longer than any ward round.',
    tingewick: 'Director, 1995. Still recovering.',
    jobTitle: 'Consultant Psychiatrist',
    workplace: 'Oxford Health NHS Foundation Trust',
    careerPath: 'Psychiatry training in Oxford. Consultant in adult mental health since 2008.',
    interests: 'Writing, swimming, pub quizzes.',
    linkedin: 'https://www.linkedin.com/',
    acceptsContact: true,
    allowsTags: true,
    isAdmin: false,
  },
  {
    id: 'sample-willow',
    name: 'Sample Willow',
    college: 'Lincoln',
    clinicalTraining: 'Oxford and Banbury',
    memory: 'The long vac in 1993, working as a healthcare assistant on the wards.',
    tingewick: 'Band. Drums, mostly on time.',
    jobTitle: 'Public Health Consultant',
    workplace: 'UK Health Security Agency',
    careerPath: 'Public health since 2005. Worked on outbreak response and screening programmes.',
    interests: 'Walking, photography, local history.',
    acceptsContact: true,
    allowsTags: true,
    isAdmin: false,
  },
]

// Finder and map details for the sample people.
const sampleExtras: Record<string, Partial<Member>> = {
  'sample-alder': { specialty: 'Cardiology', town: 'Reading', country: 'United Kingdom', lat: 51.454, lng: -0.978, links: { wikipedia: 'https://en.wikipedia.org/wiki/Cardiology' } },
  'sample-birch': { specialty: 'General practice', town: 'Northampton', country: 'United Kingdom', lat: 52.24, lng: -0.9, previousName: 'Sample Ash', showEmail: true, email: 'birch@example.com' },
  'sample-cedar': { specialty: 'Neurology', town: 'London', country: 'United Kingdom', lat: 51.507, lng: -0.128, links: { orcid: '0000-0002-1825-0097' } },
  'sample-elm': { specialty: 'Clinical radiology', town: 'London', country: 'United Kingdom', lat: 51.507, lng: -0.128 },
  'sample-hazel': { specialty: 'Medical oncology', town: 'Edinburgh', country: 'United Kingdom', lat: 55.953, lng: -3.188 },
  'sample-linden': { specialty: 'Anaesthetics', town: 'Singapore', country: 'Singapore', lat: 1.352, lng: 103.82 },
  'sample-rowan': { specialty: 'Orthopaedic surgery', town: 'Oxford', country: 'United Kingdom', lat: 51.752, lng: -1.258 },
  'sample-willow': { specialty: 'Paediatrics', town: 'Wexford', country: 'Ireland', lat: 52.336, lng: -6.463 },
}
for (const m of members) Object.assign(m, sampleExtras[m.id])

type PhotoSeed = Omit<Photo, 'tags' | 'thumb'> & { tags: [string, number, number, Tag['status']][] }

const seeds: PhotoSeed[] = [
  {
    id: 'photo-01',
    title: 'Matriculation morning',
    year: '1990',
    place: 'Sheldonian Theatre',
    caption: 'Sub fusc, nerves, and a lot of squinting into the sun.',
    src: asset('/photos/photo-01.svg'),
    tags: [
      ['sample-alder', 22, 48, 'confirmed'],
      ['sample-birch', 50, 46, 'confirmed'],
      ['sample-hazel', 76, 50, 'pending'],
    ],
  },
  {
    id: 'photo-02',
    title: 'Anatomy lab',
    year: '1991',
    place: 'Department of Human Anatomy',
    caption: 'Second year. White coats, dissection manuals, and the smell of formalin.',
    src: asset('/photos/photo-02.svg'),
    tags: [
      ['sample-cedar', 30, 45, 'confirmed'],
      ['sample-willow', 68, 47, 'confirmed'],
    ],
  },
  {
    id: 'photo-03',
    title: 'Tingewick 1995',
    year: '1995',
    place: 'Tingewick pantomime',
    caption: 'Rita the Pink Elephant made her usual appearance. So did the Dame.',
    src: asset('/photos/photo-03.svg'),
    tags: [
      ['sample-hazel', 48, 42, 'confirmed'],
      ['sample-rowan', 20, 55, 'confirmed'],
      ['sample-birch', 78, 52, 'confirmed'],
    ],
  },
  {
    id: 'photo-04',
    title: 'Osler House summer party',
    year: '1994',
    place: 'Osler House',
    caption: 'The garden, a borrowed sound system, and most of the year.',
    src: asset('/photos/photo-04.svg'),
    tags: [
      ['sample-elm', 35, 50, 'pending'],
      ['sample-linden', 62, 48, 'confirmed'],
    ],
  },
  {
    id: 'photo-05',
    title: 'Ward round, JR',
    year: '1995',
    place: 'John Radcliffe Hospital',
    caption: 'Clinical years. Stethoscopes finally earned.',
    src: asset('/photos/photo-05.svg'),
    tags: [['sample-alder', 55, 44, 'pending']],
  },
  {
    id: 'photo-06',
    title: 'Graduation',
    year: '1996',
    place: 'Sheldonian Theatre',
    caption: 'Done. Six years, one degree, and a very long lunch afterwards.',
    src: asset('/photos/photo-06.svg'),
    tags: [
      ['sample-cedar', 18, 50, 'confirmed'],
      ['sample-rowan', 40, 48, 'confirmed'],
      ['sample-willow', 62, 50, 'confirmed'],
      ['sample-elm', 84, 49, 'confirmed'],
    ],
  },
]

let tagSeq = 0
export const photos: Photo[] = seeds.map((s) => ({
  ...s,
  thumb: s.src,
  tags: s.tags.map(([memberId, x, y, status]) => ({
    id: `tag-${++tagSeq}`,
    photoId: s.id,
    memberId,
    x,
    y,
    status,
    suggestedBy: 'sample-birch',
  })),
}))

const allowed: AllowedEmail[] = [
  { email: 'sam@example.com', note: 'organiser', inviteSentAt: null },
  { email: 'birch@example.com', note: 'Somerville', inviteSentAt: '2026-10-01T09:00:00Z' },
]
const inbox: InboxMessage[] = []

const joinRequests: JoinRequest[] = [
  { id: 'jr-1', userId: 'u-1', email: 'rowan.new@example.com', fullName: 'Rowan Newcomer', previousName: 'Rowan Oldname',
    kind: 'request', matchedName: null, status: 'pending', createdAt: '2026-10-07T18:00:00Z', decidedAt: null },
  { id: 'jr-2', userId: 'u-2', email: 'hazel.name@example.com', fullName: 'Hazel Sample', previousName: null,
    kind: 'name_match', matchedName: 'Sample Hazel', status: 'accepted', createdAt: '2026-10-06T10:00:00Z', decidedAt: '2026-10-06T10:00:00Z' },
]
const roster: RosterPerson[] = [
  { id: 'r-1', fullName: 'Sample Cedar', otherNames: [], email: null, specialty: 'Neurology', cohort: 'clinical', memberId: null, joinedByName: false },
  { id: 'r-2', fullName: 'Sample Willow', otherNames: [], email: 'willow@example.com', specialty: 'General practice', cohort: 'clinical', memberId: null, joinedByName: false },
]

const featured: string[] = ['photo-06', 'photo-01']

// Placeholder speeches for the demo. The real ones live only in the database.
const speeches: Speech[] = [
  {
    id: 'speech-1',
    slug: 'sample-welcome',
    title: 'A sample welcome',
    speaker: 'Sample Alder',
    occasion: 'Demo reunion dinner',
    pdfName: 'A sample welcome.pdf',
    body: [
      'This is placeholder text for the demo site. The real speeches are added by the organisers.',
      '## Then',
      'We arrived knowing very little and left knowing a little more. Somewhere in between we became friends.',
      '## Now',
      'Thirty years on, the faces are familiar and the stories are new.',
      '**A toast to the next thirty.**',
    ].join('\n\n'),
  },
  {
    id: 'speech-2',
    slug: 'sample-reflection',
    title: 'A sample reflection',
    speaker: 'Sample Birch',
    occasion: 'Written after the demo dinner',
    body: ['Another placeholder, to show how a second speech looks.', 'It was good to see you all.', '*Sample Birch*'].join('\n\n'),
  },
]
const quotes: SpeechQuote[] = [
  { id: 'q-1', text: 'Somewhere in between we became friends.', attribution: 'Sample Alder', speechSlug: 'sample-welcome', speechTitle: 'A sample welcome' },
  { id: 'q-2', text: 'It was good to see you all.', attribution: 'Sample Birch', speechSlug: 'sample-reflection', speechTitle: 'A sample reflection' },
  { id: 'q-3', text: 'Thirty years on, the faces are familiar and the stories are new.', attribution: 'Sample Alder', speechSlug: 'sample-welcome', speechTitle: 'A sample welcome' },
]

// A one-page PDF with just the title, so the demo download opens.
function samplePdf(title: string) {
  const text = title.replace(/[()\\]/g, '')
  const stream = `BT /F1 24 Tf 72 720 Td (${text}) Tj ET`
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]
  let out = '%PDF-1.4\n'
  const offsets = objs.map((o, i) => {
    const at = out.length
    out += `${i + 1} 0 obj\n${o}\nendobj\n`
    return at
  })
  const xref = out.length
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return out
}

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v))

export const sampleRepo: Repo = {
  async listMembers() {
    return clone(members)
  },
  async getMember(id) {
    return clone(members.find((m) => m.id === id) ?? null)
  },
  async listPhotos() {
    return clone(photos)
  },
  async listSpeeches() {
    return clone(speeches.map(({ body: _body, ...rest }) => rest))
  },
  async getSpeech(slug) {
    return clone(speeches.find((s) => s.slug === slug) ?? null)
  },
  async getSpeechPdf(slug) {
    const s = speeches.find((x) => x.slug === slug)
    if (!s?.pdfName) return null
    return { name: s.pdfName, blob: new Blob([samplePdf(s.title)], { type: 'application/pdf' }) }
  },
  async listSpeechQuotes() {
    return clone(quotes)
  },
  async getPhoto(id) {
    return clone(photos.find((p) => p.id === id) ?? null)
  },
  async listFeaturedPhotos() {
    return clone(featured.map((id) => photos.find((p) => p.id === id)).filter((p): p is Photo => Boolean(p)))
  },
  async listHomeFallbackPhotos() {
    return clone(photos.slice(0, 3))
  },
  async setFeatured(photoId, rank) {
    const i = featured.indexOf(photoId)
    if (i >= 0) featured.splice(i, 1)
    if (rank !== null) featured.splice(rank - 1, 0, photoId)
  },
  async suggestTag(photoId, memberId, x, y) {
    const photo = photos.find((p) => p.id === photoId)
    if (!photo) throw new Error('Photo not found')
    if (photo.tags.some((t) => t.memberId === memberId)) throw new Error('Already tagged')
    const status = memberId === SAMPLE_ME ? 'confirmed' : 'pending'
    photo.tags.push({ id: `tag-${++tagSeq}`, photoId, memberId, x, y, status, suggestedBy: SAMPLE_ME })
  },
  async decideTag(tagId, status) {
    for (const p of photos) {
      const t = p.tags.find((t) => t.id === tagId)
      if (t) t.status = status
    }
  },
  async removeTag(tagId) {
    for (const p of photos) p.tags = p.tags.filter((t) => t.id !== tagId)
  },
  async myPendingTags() {
    return clone(
      photos.flatMap((photo) =>
        photo.tags.filter((t) => t.memberId === SAMPLE_ME && t.status === 'pending').map((tag) => ({ tag, photo })),
      ),
    )
  },
  async myEmail() {
    return 'sam@example.com'
  },
  async updateProfile(input: ProfileInput) {
    const me = members.find((m) => m.id === SAMPLE_ME)
    if (me) Object.assign(me, input)
  },
  async sendContact(toMemberId, message) {
    const to = members.find((m) => m.id === toMemberId)
    if (!to?.acceptsContact) throw new Error('Not accepting messages')
    if (toMemberId === SAMPLE_ME) {
      inbox.unshift({
        id: `msg-${Date.now()}`,
        message,
        createdAt: new Date().toISOString(),
        fromId: SAMPLE_ME,
        fromName: 'Sample Alder',
        fromEmail: 'sam@example.com',
      })
    }
  },
  async inbox() {
    return clone(inbox)
  },
  async addPhoto(input) {
    const id = `photo-${Date.now()}`
    const src = URL.createObjectURL(input.file)
    photos.push({
      id,
      title: input.title,
      year: input.year ?? null,
      place: input.place ?? null,
      caption: input.caption ?? null,
      src,
      thumb: src,
      uploadedBy: SAMPLE_ME,
      tags: [],
    })
    return id
  },
  async deletePhoto(photoId) {
    const i = photos.findIndex((p) => p.id === photoId)
    if (i >= 0) photos.splice(i, 1)
  },
  async listAllowedEmails() {
    return clone(allowed)
  },
  async addAllowedEmails(emails, note) {
    for (const e of emails) if (!allowed.some((a) => a.email === e)) allowed.push({ email: e, note: note ?? null, inviteSentAt: null })
  },
  async sendInvites({ emails, note }) {
    const now = new Date().toISOString()
    for (const e of emails) {
      const row = allowed.find((a) => a.email === e)
      if (row) row.inviteSentAt = now
      else allowed.push({ email: e, note: note ?? null, inviteSentAt: now })
    }
    return { added: emails.length, sent: emails.length, failed: [] }
  },
  async removeAllowedEmail(email) {
    const i = allowed.findIndex((a) => a.email === email)
    if (i >= 0) allowed.splice(i, 1)
  },
  async setAvatar(file) {
    const me = members.find((m) => m.id === SAMPLE_ME)
    if (me) me.avatarUrl = URL.createObjectURL(file)
  },
  async removeAvatar() {
    const me = members.find((m) => m.id === SAMPLE_ME)
    if (me) me.avatarUrl = null
  },
  async setAdmin(memberId, makeAdmin) {
    const m = members.find((x) => x.id === memberId)
    if (m) m.isAdmin = makeAdmin
  },
  async listJoinRequests() {
    return clone(joinRequests)
  },
  async decideJoinRequest(id, accept) {
    const r = joinRequests.find((j) => j.id === id)
    if (!r || r.status !== 'pending') throw new Error('This request has already been decided')
    r.status = accept ? 'accepted' : 'declined'
    r.decidedAt = new Date().toISOString()
    return { status: r.status, emailed: true }
  },
  async deleteJoinRequest(id) {
    const i = joinRequests.findIndex((j) => j.id === id)
    if (i >= 0) joinRequests.splice(i, 1)
  },
  async listRoster() {
    return clone(roster)
  },
  async importPeople(rows) {
    let added = 0
    for (const r of rows) {
      if (roster.some((p) => (r.email && p.email === r.email) || p.fullName.toLowerCase() === r.name.toLowerCase())) continue
      roster.push({ id: `r-${roster.length + 1}`, fullName: r.name, otherNames: [], email: r.email, specialty: r.specialty, cohort: r.cohort, memberId: null, joinedByName: false })
      added++
    }
    return { added, linked: 0, alreadyKnown: rows.length - added, emailsAdded: rows.filter((r) => r.email).length, toCheck: [] }
  },
  async removeAccess() {},
  async unrecognisedSignins() {
    return [{ email: 'birch.personal@example.com', firstTried: '2026-10-05T09:00:00Z', signedIn: true }]
  },
  hasProfileExtras: () => true,
  async adminMembers() {
    return members.map((m) => ({
      id: m.id,
      email: `${m.id.replace('sample-', '')}@example.com`,
      name: m.name,
      isAdmin: m.isAdmin,
      createdAt: '2026-10-01T00:00:00Z',
    }))
  },
}
