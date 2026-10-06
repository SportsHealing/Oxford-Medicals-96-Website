export type Member = {
  id: string
  name: string
  knownAs?: string | null
  college?: string | null
  clinicalTraining?: string | null
  memory?: string | null
  tingewick?: string | null
  jobTitle?: string | null
  workplace?: string | null
  careerPath?: string | null
  interests?: string | null
  linkedin?: string | null
  acceptsContact: boolean
  allowsTags: boolean
  isAdmin: boolean
}

export type ProfileInput = Omit<Member, 'id' | 'isAdmin'>

export type TagStatus = 'pending' | 'confirmed' | 'rejected'

export type Tag = {
  id: string
  photoId: string
  memberId: string
  x: number // percent from left
  y: number // percent from top
  status: TagStatus
  suggestedBy: string | null
}

export type Photo = {
  id: string
  title: string
  year?: string | null
  place?: string | null
  caption?: string | null
  src: string
  uploadedBy?: string | null
  tags: Tag[]
}

export type PhotoInput = {
  file: File
  title: string
  year?: string
  place?: string
  caption?: string
}

export type InboxMessage = {
  id: string
  message: string
  createdAt: string
  fromId: string
  fromName: string
  fromEmail: string
}

export type AdminMember = {
  id: string
  email: string
  name: string
  isAdmin: boolean
  createdAt: string
}

export type Repo = {
  listMembers(): Promise<Member[]>
  getMember(id: string): Promise<Member | null>
  listPhotos(): Promise<Photo[]>
  getPhoto(id: string): Promise<Photo | null>
  suggestTag(photoId: string, memberId: string, x: number, y: number): Promise<void>
  decideTag(tagId: string, status: 'confirmed' | 'rejected'): Promise<void>
  removeTag(tagId: string): Promise<void>
  /** Tags of the current member that still need their decision, with the photo. */
  myPendingTags(): Promise<{ tag: Tag; photo: Photo }[]>
  myEmail(): Promise<string | null>
  updateProfile(input: ProfileInput): Promise<void>
  sendContact(toMemberId: string, message: string): Promise<void>
  inbox(): Promise<InboxMessage[]>
  // Admin (addPhoto and deletePhoto are also open to members for their own photos)
  /** Uploads a photo and returns its new id. */
  addPhoto(input: PhotoInput): Promise<string>
  deletePhoto(photoId: string): Promise<void>
  listAllowedEmails(): Promise<{ email: string; note: string | null }[]>
  addAllowedEmails(emails: string[], note?: string): Promise<void>
  removeAllowedEmail(email: string): Promise<void>
  adminMembers(): Promise<AdminMember[]>
}
