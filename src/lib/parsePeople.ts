// Reads rows pasted from Google Sheets or Excel into people to import.
// Handles the sign-up sheet (timestamp, name, email), the class list
// (name, specialty, with a "Preclinical" heading part-way down), plain
// "Name, email" lines and "Name <email>".

export type ParsedPerson = {
  name: string
  email: string | null
  specialty: string | null
  cohort: 'clinical' | 'preclinical' | null
  /** Why this row may need a second look. */
  warning: string | null
}

const EMAIL = /[^\s<>,;"']+@[^\s<>,;"']+\.[^\s<>,;"']+/
const TIMESTAMP = /^\d{1,4}[/.-]\d{1,2}[/.-]\d{1,4}(\s+\d{1,2}:\d{2}(:\d{2})?)?$/
const HEADERS = new Set(['speciality', 'specialty', 'name', 'names', 'email', 'email address', 'timestamp', 'full name'])

export function parsePeople(text: string): ParsedPerson[] {
  const byKey = new Map<string, ParsedPerson>()
  let cohort: ParsedPerson['cohort'] = null

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue
    const lower = line.toLowerCase().replace(/[:\s]+$/, '')
    if (lower === 'preclinical' || lower === 'pre-clinical') {
      cohort = 'preclinical'
      continue
    }
    if (lower === 'clinical') {
      cohort = 'clinical'
      continue
    }

    let cells = raw.split('\t').map((c) => c.trim())
    if (cells.length === 1) cells = line.split(/\s*[,;]\s*/)
    const emailMatch = line.match(EMAIL)
    const email = emailMatch ? emailMatch[0].toLowerCase() : null
    const rest = cells
      .map((c) => c.replace(EMAIL, '').replace(/[<>()"]/g, ' ').replace(/\s+/g, ' ').trim())
      .filter((c) => c && /[a-z]/i.test(c) && !TIMESTAMP.test(c) && !HEADERS.has(c.toLowerCase()))
    if (!email && rest.length === 0) continue
    if (!email && cells.every((c) => !c || HEADERS.has(c.toLowerCase()))) continue

    const name = (rest[0] ?? '').replace(/^(dr|mr|mrs|ms|miss|prof)\.?\s+/i, '')
    const specialty = email ? null : (rest[1] ?? null)
    let warning: string | null = null
    if (!name) warning = 'No name'
    else if (!email && cells.length === 1 && name.split(' ').length > 4) {
      warning = 'Long name: copy from the spreadsheet so the specialty is in its own column'
    }

    const person: ParsedPerson = { name, email, specialty, cohort, warning }
    const key = email ?? `name:${name.toLowerCase()}`
    const prev = byKey.get(key)
    // Repeated sign-ups: keep one row, prefer the fuller details.
    byKey.set(key, prev ? { ...prev, name: prev.name.length >= name.length ? prev.name : name, specialty: prev.specialty ?? specialty } : person)
  }
  return [...byKey.values()]
}
