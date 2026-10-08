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
  website?: string | null
  instagram?: string | null
  twitter?: string | null
  acceptsContact: boolean
  allowsTags: boolean
  isAdmin: boolean
  avatarUrl?: string | null
}

export type ProfileInput = Omit<Member, 'id' | 'isAdmin' | 'avatarUrl'>

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
  /** Small copy for grids; the same as `src` when none has been made yet. */
  thumb: string
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

export type AllowedEmail = { email: string; note: string | null; inviteSentAt: string | null }

export type InviteResult = { added: number; sent: number; failed: { email: string; reason: string }[] }

export type AdminMember = {
  id: string
  email: string
  name: string
  isAdmin: boolean
  createdAt: string
}

export type UnrecognisedSignin = {
  email: string
  firstTried: string
  /** True if they got as far as entering a code; false if they only asked for one. */
  signedIn: boolean
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
  listAllowedEmails(): Promise<AllowedEmail[]>
  addAllowedEmails(emails: string[], note?: string): Promise<void>
  removeAllowedEmail(email: string): Promise<void>
  /** Adds addresses to the members list and emails each person an invitation. */
  sendInvites(input: { emails: string[]; note?: string; message?: string }): Promise<InviteResult>
  adminMembers(): Promise<AdminMember[]>
  /** Admin only: sign-in attempts from addresses not on the list. */
  unrecognisedSignins(): Promise<UnrecognisedSignin[]>
  setAdmin(memberId: string, makeAdmin: boolean): Promise<void>
  /** Sets the signed-in member's profile picture (already cropped). */
  setAvatar(file: File): Promise<void>
  removeAvatar(): Promise<void>
}
