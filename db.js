import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY)

async function testConnection() {
  const { data, error } = await supabase.from('Product').select('*').limit(1)
  if (error) {
    console.error('Supabase connection error:', error.message)
    return
  }
  console.log('Supabase connected, sample row:', data)
}

testConnection()
