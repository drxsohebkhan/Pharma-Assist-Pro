"use client"

/**
 * Global Firebase auth state. Wraps the app once (in AppShell) and exposes:
 *   user     — the Firebase User (null = signed out)
 *   profile  — live users/{uid} Firestore doc (premium flag updates in realtime)
 *   loading  — true until the first auth state resolves
 */

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { User } from "firebase/auth"
import { onAuthStateChanged } from "firebase/auth"
import { doc, onSnapshot } from "firebase/firestore"
import { getFirebaseAuth, getDb, isFirebaseConfigured } from "@/lib/firebase"
import { signOutUser, type UserProfile } from "@/lib/firebase-auth"

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  configured: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  configured: false,
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (nextUser) => {
      setUser(nextUser)
      if (!nextUser) {
        setProfile(null)
        setLoading(false)
      }
      // When signed in, `loading` resolves once the profile snapshot arrives (below)
    })
    return unsubscribe
  }, [])

  // Live profile subscription — premium unlocks apply instantly, no refresh needed.
  useEffect(() => {
    if (!user) return
    const ref = doc(getDb(), "users", user.uid)
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data()
          setProfile({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            premium: data.premium === true,
            accessCode: typeof data.accessCode === "string" ? data.accessCode : null,
            isAdmin: data.isAdmin === true,
          })
        } else {
          setProfile(null)
        }
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsubscribe
  }, [user])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      configured: isFirebaseConfigured,
      signOut: signOutUser,
    }),
    [user, profile, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
