// Specialties and the groups used for filters (from the class list's colour coding).
export const SPECIALTY_GROUPS: Record<string, string[]> = {
  'Primary care': ['General practice'],
  'Medical specialties': [
    'Cardiology', 'Respiratory medicine', 'Gastroenterology', 'Hepatology', 'Infectious diseases',
    'Medical microbiology', 'Renal medicine', 'Neurology', 'Endocrinology', 'Rheumatology', 'Dermatology',
    'Clinical genetics', 'Occupational medicine', 'Public health', 'Genitourinary medicine', 'Palliative care',
    'General internal medicine', 'Geriatric medicine',
  ],
  'Surgical specialties': [
    'Orthopaedic surgery', 'General surgery', 'Breast surgery', 'Plastic surgery', 'Urological surgery',
    'Cardiothoracic surgery', 'Oral and maxillofacial surgery', 'ENT surgery', 'Ophthalmology', 'Neurosurgery',
    'Vascular surgery',
  ],
  Radiology: ['Clinical radiology'],
  'Anaesthesia and intensive care': ['Anaesthetics', 'Intensive care'],
  'Cancer and blood': ['Medical oncology', 'Clinical oncology', 'Haematology'],
  Psychiatry: ['Psychiatry', 'Old age psychiatry', 'Child and adolescent psychiatry', 'Forensic psychiatry'],
  'Emergency medicine': ['Emergency medicine'],
  'Women and children': ['Obstetrics and gynaecology', 'Paediatrics'],
  'Other careers': ['Healthcare industry', 'Research', 'Law', 'Cruise ship medicine', 'Space medicine'],
}

export const SPECIALTIES = Object.values(SPECIALTY_GROUPS).flat().sort()

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Free text ("Orthopedic surgery", "Anaesthetics / ITU", "Prison GP") to a group.
export function specialtyGroup(text?: string | null): string | null {
  if (!text) return null
  const t = fold(text)
  if (/\bgp\b|general pract/.test(t)) return 'Primary care'
  if (/radiolog/.test(t)) return 'Radiology'
  if (/anaesth|anesth|\bitu\b|intensive/.test(t)) return 'Anaesthesia and intensive care'
  if (/oncolog|haemat|hemat/.test(t)) return 'Cancer and blood'
  if (/psychiat/.test(t)) return 'Psychiatry'
  if (/emergency/.test(t)) return 'Emergency medicine'
  if (/paediat|pediat|obstet|gynae/.test(t)) return 'Women and children'
  if (/industry|start-?up|barrister|law|cruise|space|research/.test(t)) return 'Other careers'
  if (/surg|orthop|ophthal|ophtham|\bent\b/.test(t)) return 'Surgical specialties'
  if (/genetic/.test(t)) return 'Medical specialties'
  for (const [group, list] of Object.entries(SPECIALTY_GROUPS)) {
    if (list.some((s) => t.includes(fold(s)))) return group
  }
  return /medicine|ology|care/.test(t) ? 'Medical specialties' : null
}

export { fold as foldText }
