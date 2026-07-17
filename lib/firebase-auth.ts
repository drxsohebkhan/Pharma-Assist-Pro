/**
 * Google Sign-In + Firestore user document management.
 * The ONLY auth methods in this app are Google Sign-In and sign-out —
 * no passwords are ever collected or stored.
 */

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth"
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { getFirebaseAuth, getDb } from "@/lib/firebase"

export interface UserProfile {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  premium: boolean
  accessCode: string | null
  isAdmin: boolean
}

// Prevents duplicate popup requests when the button is double-clicked.
let signInInFlight = false

/** Maps Firebase auth error codes to friendly, human messages. */
export function friendlyAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? ""
  switch (code) {
    case "auth/popup-closed-by-user":
      return "Sign-in window was closed before finishing. Please try again."
    case "auth/cancelled-popup-request":
      return "Another sign-in is already in progress."
    case "auth/popup-blocked":
      return "Your browser blocked the sign-in popup. Allow popups for this site and try again."
    case "auth/network-request-failed":
      return "Network error — check your connection and try again."
    case "auth/unauthorized-domain":
      return "This domain is not authorized for sign-in. Add it in Firebase Console → Authentication → Settings."
    case "auth/user-disabled":
      return "This account has been disabled. Contact support."
    case "auth/internal-error":
      return "Something went wrong on our side. Please try again."
    default:
      return (error as Error)?.message?.replace(/^Firebase:\s*/, "") || "Sign-in failed. Please try again."
  }
}

/**
 * Creates users/{uid} on first login, or updates only lastLogin on
 * subsequent logins — never overwrites premium / accessCode / isAdmin.
 */
export async function ensureUserDocument(user: User): Promise<UserProfile> {
  const db = getDb()
  const ref = doc(db, "users", user.uid)
  const snap = await getDoc(ref)

  if (snap.exists()) {
    await updateDoc(ref, { lastLogin: serverTimestamp() })
    const data = snap.data()
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      premium: data.premium === true,
      accessCode: typeof data.accessCode === "string" ? data.accessCode : null,
      isAdmin: data.isAdmin === true,
    }
  }

  await setDoc(ref, {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
    premium: false,
    accessCode: null,
    isAdmin: false,
  })

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    premium: false,
    accessCode: null,
    isAdmin: false,
  }
}

/**
 * Full Google sign-in flow: popup → verify → upsert Firestore user doc.
 * Duplicate calls while a popup is open are rejected silently upstream.
 */
export async function signInWithGoogle(): Promise<UserProfile> {
  if (signInInFlight) {
    throw Object.assign(new Error("Another sign-in is already in progress."), {
      code: "auth/cancelled-popup-request",
    })
  }
  signInInFlight = true
  try {
    const auth = getFirebaseAuth()
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: "select_account" })
    const credential = await signInWithPopup(auth, provider)
    return await ensureUserDocument(credential.user)
  } finally {
    signInInFlight = false
  }
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(getFirebaseAuth())
}
