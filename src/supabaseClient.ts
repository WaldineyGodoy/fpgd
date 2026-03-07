
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ayhbafvvnbwrnfqglklp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5aGJhZnZ2bmJ3cm5mcWdsa2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzE3ODgsImV4cCI6MjA4NTYwNzc4OH0._aoaYtCLonzZ4OhexckY96SRaVa1tSEN0UZsC4FaikI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
