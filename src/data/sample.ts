// Sample data and an in-memory repo for prototype mode.
// Every person and photo here is fictional.
import { asset } from '../asset.ts'
import type { InboxMessage, Member, Photo, ProfileInput, Repo, Tag } from './types.ts'

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

type PhotoSeed = Omit<Photo, 'tags'> & { tags: [string, number, number, Tag['status']][] }

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

const allowed: { email: string; note: string | null }[] = [
  { email: 'sam@example.com', note: 'organiser' },
  { email: 'birch@example.com', note: 'Somerville' },
]
const inbox: InboxMessage[] = []

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
  async getPhoto(id) {
    return clone(photos.find((p) => p.id === id) ?? null)
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
    photos.push({
      id,
      title: input.title,
      year: input.year ?? null,
      place: input.place ?? null,
      caption: input.caption ?? null,
      src: URL.createObjectURL(input.file),
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
    for (const e of emails) if (!allowed.some((a) => a.email === e)) allowed.push({ email: e, note: note ?? null })
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
