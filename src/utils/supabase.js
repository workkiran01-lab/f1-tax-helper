import { createClient } from '@supabase/supabase-js'
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
export const authConfigured = Boolean(url && key)
// Public tools and guest mode work without optional account configuration.
const supabase = authConfigured ? createClient(url, key) : null
export default supabase
