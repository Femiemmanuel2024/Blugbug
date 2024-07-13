// src/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kcqmbuqlssurljawddle.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjcW1idXFsc3N1cmxqYXdkZGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjA2Mzc0NzEsImV4cCI6MjAzNjIxMzQ3MX0.xz1oC08DHvembM3ZYAi3Fv0OSwzCiOxWBfoMtroPiVI'

export const supabase = createClient(supabaseUrl, supabaseKey)
