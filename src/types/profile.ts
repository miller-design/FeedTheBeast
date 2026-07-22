/** Synced profile fields for the signed-in Dexie Cloud user */

export type UserProfile = {
  /** Same as Dexie Cloud `userId` (usually email) */
  id: string
  username: string
  displayName: string
  updatedAt: string
}

/** Editable profile form values */
export type UserProfileInput = {
  username: string
  displayName: string
}
