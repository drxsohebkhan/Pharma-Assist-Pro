/**
 * Firebase client initialization — the single source of truth for the app,
 * auth and Firestore instances. Import from here only; never re-initialize.
 *
 * Required env vars (Firebase Console → Project Settings → General → Your apps):
 *   NEXT_PUBLIC_FIREBASE_API_KEY
 *   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *   NEXT_PUBLIC_FIREBASE_APP_ID
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import { getAuth, browserLocalPersistence, setPersistence, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

/** True when every required Firebase env var is present. */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId,
)

let cachedAuth: Auth | null = null

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured. Set the NEXT_PUBLIC_FIREBASE_* environment variables.")
  }
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
}

export function getFirebaseAuth(): Auth {
  if (cachedAuth) return cachedAuth
  const auth = getAuth(getFirebaseApp())
  // Keep the user logged in across refreshes and browser restarts.
  // Fire-and-forget: local persistence is already the default in browsers.
  setPersistence(auth, browserLocalPersistence).catch(() => {})
  cachedAuth = auth
  return auth
}

export function getDb(): Firestore {
  return getFirestore(getFirebaseApp())
}
