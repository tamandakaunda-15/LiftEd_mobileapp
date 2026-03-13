import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Use the Service Role Key if you have it, or just ensure your Anon key is correct
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const zoneId = searchParams.get('zoneId')

  // FETCH FROM THE NEW VIEW
  let query = supabase.from('live_pea_stats').select('*')

  if (zoneId) {
    query = query.eq('zone_id', zoneId)
  }

  const { data, error } = await query
  return NextResponse.json(data || [])
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, emis_id, zone_id, phone, total_students } = body

    const { data, error } = await supabase
      .from('schools')
      .insert([
        { 
          name, 
          emis_id, 
          zone_id, 
          phone, 
          total_students: parseInt(total_students) || 0,
          at_risk_count: 0, // Initialize AI tracker at zero
          sync_status: 'Authorized' 
        }
      ])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}