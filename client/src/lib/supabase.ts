import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zukouymdwikwgldqhvoz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1a291eW1kd2lrd2dsZHFodm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTIwMDcsImV4cCI6MjA2NjA4ODAwN30.qMk4CrRJiN1IZUoEyk83LskilWXCdi3nrjVBQQaROLo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helper functions
export const auth = {
  // Sign up with email and password
  signUp: async (email: string, password: string, userData: { username: string; name: string; handicap?: number }) => {
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
    return { data, error }
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // Listen to auth changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  },

  // Reset password
  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    return { error }
  },

  // Update password
  updatePassword: async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password
    })
    return { error }
  }
}

// Database helper functions
export const db = {
  // Get user profile
  getUserProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    return { data, error }
  },

  // Update user profile
  updateUserProfile: async (userId: string, updates: any) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
    return { data, error }
  },

  // Create user profile after signup
  createUserProfile: async (userId: string, profile: any) => {
    const { data, error } = await supabase
      .from('users')
      .insert([{ id: userId, ...profile }])
    return { data, error }
  }
} 