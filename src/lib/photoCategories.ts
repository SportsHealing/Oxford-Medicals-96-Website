// The occasions the archive is sorted into. The order here is the order on the
// Photos page. Keep the ids in step with supabase/migrations/0014 and the
// sort-photos Edge Function.
export const PHOTO_CATEGORIES = [
  { id: 'graduation', label: 'Graduation', hint: 'Gowns, the Sheldonian, degree day' },
  { id: 'tingewick', label: 'Tingewick', hint: 'The pantomime, rehearsals and costumes' },
  { id: 'formal', label: 'Balls & dinners', hint: 'Black tie, balls, formal dinners' },
  { id: 'social', label: 'Parties & nights out', hint: 'Parties, pubs, celebrations' },
  { id: 'sport', label: 'Sport', hint: 'Rowing, rugby, football, teams' },
  { id: 'medicine', label: 'Wards & studies', hint: 'Hospital, lectures, labs, white coats' },
  { id: 'everyday', label: 'Friends & everyday life', hint: 'College, rooms, picnics, small groups' },
  { id: 'travel', label: 'Trips & electives', hint: 'Holidays, electives, travel' },
  { id: 'reunions', label: 'Reunions', hint: 'Get-togethers since graduating' },
  { id: 'other', label: 'Other', hint: 'Anything else' },
] as const

export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number]['id']

const byId = new Map<string, (typeof PHOTO_CATEGORIES)[number]>(PHOTO_CATEGORIES.map((c) => [c.id, c]))
export const categoryLabel = (id: string | null | undefined) => (id ? byId.get(id)?.label ?? 'Other' : 'Not sorted yet')
export const isCategory = (id: string | null | undefined): id is PhotoCategory => Boolean(id && byId.has(id))
export const categoryOrder = (id: string | null | undefined) => {
  const i = PHOTO_CATEGORIES.findIndex((c) => c.id === id)
  return i < 0 ? PHOTO_CATEGORIES.length : i
}
