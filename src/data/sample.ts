// Sample data for the Phase A prototype.
// Every person and photo here is fictional. Real content arrives in Phase B.

export type Person = {
  id: string
  name: string
  knownAs?: string
  college: string
  clinicalTraining: string
  memory: string
  tingewick: string
  jobTitle: string
  workplace: string
  careerPath: string
  interests: string
  linkedin?: string
  acceptsContact: boolean
  allowsTags: boolean
}

export type Tag = {
  personId: string
  x: number // percentage from left
  y: number // percentage from top
  status: 'confirmed' | 'pending'
}

export type Photo = {
  id: string
  title: string
  year: string
  place: string
  caption: string
  src: string
  tags: Tag[]
}

export const people: Person[] = [
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
    acceptsContact: true,
    allowsTags: true,
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
  },
]

export const photos: Photo[] = [
  {
    id: 'photo-01',
    title: 'Matriculation morning',
    year: '1990',
    place: 'Sheldonian Theatre',
    caption: 'Sub fusc, nerves, and a lot of squinting into the sun.',
    src: '/photos/photo-01.svg',
    tags: [
      { personId: 'sample-alder', x: 22, y: 48, status: 'confirmed' },
      { personId: 'sample-birch', x: 50, y: 46, status: 'confirmed' },
      { personId: 'sample-hazel', x: 76, y: 50, status: 'pending' },
    ],
  },
  {
    id: 'photo-02',
    title: 'Anatomy lab',
    year: '1991',
    place: 'Department of Human Anatomy',
    caption: 'Second year. White coats, dissection manuals, and the smell of formalin.',
    src: '/photos/photo-02.svg',
    tags: [
      { personId: 'sample-cedar', x: 30, y: 45, status: 'confirmed' },
      { personId: 'sample-willow', x: 68, y: 47, status: 'confirmed' },
    ],
  },
  {
    id: 'photo-03',
    title: 'Tingewick 1995',
    year: '1995',
    place: 'Tingewick pantomime',
    caption: 'Rita the Pink Elephant made her usual appearance. So did the Dame.',
    src: '/photos/photo-03.svg',
    tags: [
      { personId: 'sample-hazel', x: 48, y: 42, status: 'confirmed' },
      { personId: 'sample-rowan', x: 20, y: 55, status: 'confirmed' },
      { personId: 'sample-birch', x: 78, y: 52, status: 'confirmed' },
    ],
  },
  {
    id: 'photo-04',
    title: 'Osler House summer party',
    year: '1994',
    place: 'Osler House',
    caption: 'The garden, a borrowed sound system, and most of the year.',
    src: '/photos/photo-04.svg',
    tags: [
      { personId: 'sample-elm', x: 35, y: 50, status: 'pending' },
      { personId: 'sample-linden', x: 62, y: 48, status: 'confirmed' },
    ],
  },
  {
    id: 'photo-05',
    title: 'Ward round, JR',
    year: '1995',
    place: 'John Radcliffe Hospital',
    caption: 'Clinical years. Stethoscopes finally earned.',
    src: '/photos/photo-05.svg',
    tags: [{ personId: 'sample-alder', x: 55, y: 44, status: 'confirmed' }],
  },
  {
    id: 'photo-06',
    title: 'Graduation',
    year: '1996',
    place: 'Sheldonian Theatre',
    caption: 'Done. Six years, one degree, and a very long lunch afterwards.',
    src: '/photos/photo-06.svg',
    tags: [
      { personId: 'sample-cedar', x: 18, y: 50, status: 'confirmed' },
      { personId: 'sample-rowan', x: 40, y: 48, status: 'confirmed' },
      { personId: 'sample-willow', x: 62, y: 50, status: 'confirmed' },
      { personId: 'sample-elm', x: 84, y: 49, status: 'confirmed' },
    ],
  },
]

export function personById(id: string): Person | undefined {
  return people.find((p) => p.id === id)
}

export function photoById(id: string): Photo | undefined {
  return photos.find((p) => p.id === id)
}

export function photosFeaturing(personId: string): Photo[] {
  return photos.filter((p) => p.tags.some((t) => t.personId === personId))
}
