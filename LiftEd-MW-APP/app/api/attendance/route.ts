import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use Service Role for backend writes
)

export async function POST(req: Request) {
  try {
    const { attendance } = await req.json()

    if (!attendance || !Array.isArray(attendance)) {
      return NextResponse.json({ error: "Invalid attendance data" }, { status: 400 })
    }

    // This performs the batch upsert to Supabase
    // It matches the student_id and date to prevent duplicates
    const { data, error } = await supabase
      .from('attendance')
      .upsert(attendance, { onConflict: 'student_id, date' })
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, count: data.length })
  } catch (error: any) {
    console.error("API Attendance Error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Optional: GET method for the Headteacher to fetch daily aggregates
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('status')
      .eq('date', date)

    if (error) throw error

    return NextResponse.json({ attendance: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}