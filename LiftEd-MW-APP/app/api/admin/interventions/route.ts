// app/api/admin/interventions/route.ts
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET(request: Request) { // Added 'request' parameter
  try {
    // 1. Extract schoolId from the URL parameters
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 2. Build the query with a join on the students table
    let query = supabase
      .from('interventions')
      .select(`
        *,
        student:students!inner (
          first_name,
          last_name,
          standard,
          school_id
        )
      `)

    // 3. APPLY THE FILTER: Only fetch interventions for students in THIS school
    if (schoolId) {
      query = query.eq('students.school_id', schoolId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Intervention API Error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}