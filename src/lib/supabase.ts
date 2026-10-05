import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Supabase is optional. Without the two env vars the site runs in
// prototype mode with sample data and a pretend sign-in.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null

export const isLive = supabase !== null
