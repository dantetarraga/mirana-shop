import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_API_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_API_KEY environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  const { data, error } = await supabase.from('Product').select('*').limit(1)
  if (error) {
    console.error('Supabase connection error:', error.message)
    return
  }
  console.log('Supabase connected, sample row:', data)
}

testConnection()
