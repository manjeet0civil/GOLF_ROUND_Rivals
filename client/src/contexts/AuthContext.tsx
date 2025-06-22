import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  profile: any | null
  loading: boolean
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  updateProfile: (updates: any) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial user
    const getInitialUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)
      
      if (currentUser) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          try {
            const response = await fetch('/api/users/profile', {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
            })
            
            if (response.ok) {
              const profileData = await response.json()
              setProfile(profileData.user)
            } else if (response.status === 404) {
              // User profile doesn't exist, try to create it
              console.log('User profile not found, attempting to create...')
              const createResponse = await fetch('/api/users/profile-from-supabase', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
              })
              
              if (createResponse.ok) {
                const profileData = await createResponse.json()
                setProfile(profileData.user)
              }
            }
          } catch (error) {
            console.error('Error loading user profile:', error)
          }
        }
      }
      
      setLoading(false)
    }

    getInitialUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        try {
          const response = await fetch('/api/users/profile', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          })
          
          if (response.ok) {
            const profileData = await response.json()
            setProfile(profileData.user)
          } else if (response.status === 404) {
            // User profile doesn't exist, try to create it
            console.log('User profile not found, attempting to create...')
            const createResponse = await fetch('/api/users/profile-from-supabase', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
            })
            
            if (createResponse.ok) {
              const profileData = await createResponse.json()
              setProfile(profileData.user)
            }
          }
        } catch (error) {
          console.error('Error loading user profile:', error)
        }
      } else {
        setProfile(null)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, userData: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: userData.username,
          name: userData.name,
          handicap: userData.handicap || 0
        }
      }
    })
    
    if (!error && data.user) {
      // Get the session to get the access token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Create user profile in our database through our API
        try {
          const response = await fetch('/api/users/profile', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: userData.username,
              email: userData.email,
              name: userData.name,
              handicap: userData.handicap || 0
            })
          })

          if (!response.ok) {
            const errorData = await response.json()
            console.error('Error creating user profile:', errorData)
            // Don't return error here, just log it - user can still use the app
          } else {
            const profileData = await response.json()
            setProfile(profileData.user)
          }
        } catch (profileError) {
          console.error('Error creating user profile:', profileError)
          // Don't return error here, just log it - user can still use the app
        }
      }
    }
    
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (!error && data.user) {
      // Get the session to get the access token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Try to get user profile, create if it doesn't exist
        try {
          const response = await fetch('/api/users/profile', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          })
          
          if (response.ok) {
            const profileData = await response.json()
            setProfile(profileData.user)
          } else if (response.status === 404) {
            // User profile doesn't exist, try to create it
            console.log('User profile not found, attempting to create...')
            const createResponse = await fetch('/api/users/profile-from-supabase', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
            })
            
            if (createResponse.ok) {
              const profileData = await createResponse.json()
              setProfile(profileData.user)
            }
          }
        } catch (profileError) {
          console.error('Error handling user profile:', profileError)
          // Don't return error here, just log it - user can still use the app
        }
      }
    }
    
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    return { error }
  }

  const updateProfile = async (updates: any) => {
    if (!user) return { error: new Error('No user logged in') }
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { error: new Error('No session found') }
    
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        return { error: new Error(errorData.message || 'Failed to update profile') }
      }
      
      const profileData = await response.json()
      setProfile(profileData.user)
      return { error: null }
    } catch (error) {
      console.error('Error updating profile:', error)
      return { error: new Error('Failed to update profile') }
    }
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 