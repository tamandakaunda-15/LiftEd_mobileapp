// app/api/students/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize the Admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET: Fetches filtered students for teachers or all for headteachers
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const standard = searchParams.get('standard');

    // Start building the query
    let query = supabaseAdmin.from('students').select('*');

    // 1. If schoolId is provided, filter by school (Essential for privacy)
    if (schoolId) {
      query = query.eq('school_id', schoolId);
    }

    // 2. If standard is provided, filter for that specific teacher's class
    if (standard && standard !== 'undefined' && standard !== 'null') {
      query = query.eq('standard', parseInt(standard));
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase GET Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ students: data || [] }, { status: 200 });
  } catch (err) {
    console.error("Server Error in GET:", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

/**
 * POST: Runs when the Headteacher clicks 'Register Student'
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Strict Validation: Prevent empty strings as UUIDs
    if (!body.schoolId || body.schoolId.trim() === "") {
      return NextResponse.json({ error: "Invalid School UUID: Received empty string" }, { status: 400 });
    }

    const generatedCode = `STU-${Math.floor(10000 + Math.random() * 90000)}`;

    const { data: newStudentData, error: studentError } = await supabaseAdmin
      .from('students')
      .insert([
        { 
          student_code: generatedCode, 
          first_name: body.firstName, 
          last_name: body.lastName, 
          standard: parseInt(body.standard) || 1, 
          gender: (body.gender || "unknown").toLowerCase(),
          age: parseInt(body.age) || 0,
          district: body.district || "Unknown",
          guardian_name: body.guardianName,
          guardian_phone: body.guardianPhone,
          home_address: body.homeAddress,
          school_id: body.schoolId, // Should now be a clean UUID
          risk_score: 0,
          risk_level: 'green'
        }
      ])
      .select();

    if (studentError) {
      console.error("Supabase POST Error (Student):", studentError);
      return NextResponse.json({ error: studentError.message }, { status: 500 });
    }

    const newStudent = newStudentData[0];

    // Baseline history generation...
    const baselineHistory = ["Round 1", "Round 2", "Round 3", "Round 4", "Round 5"].map(term => ({
      student_id: newStudent.id,
      academic_term: term,
      c16_2: 1, c16_4: 1, c19_2: 1, g36a_9: 1, h1: 1,
      g1b_2t: 1, g36a_2: 1, j3: 1, g36c_4: 1, c17: 1,
      g4_a: 1, j5: 1, j7: 1, j2: 1, g4_e: 1
    }));
    await supabaseAdmin.from('student_history').insert(baselineHistory);

    return NextResponse.json({ student: newStudent }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

/**
 * PATCH: Runs when the Headteacher edits/updates a student
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Student ID is required." }, { status: 400 });
    }

    // Map frontend camelCase to database snake_case just like in POST
    const dbUpdates: any = {};
    if (updates.firstName) dbUpdates.first_name = updates.firstName;
    if (updates.lastName) dbUpdates.last_name = updates.lastName;
    if (updates.standard) dbUpdates.standard = parseInt(updates.standard);
    if (updates.gender) dbUpdates.gender = updates.gender.toLowerCase();
    if (updates.age) dbUpdates.age = parseInt(updates.age);
    if (updates.district) dbUpdates.district = updates.district;
    if (updates.guardianName) dbUpdates.guardian_name = updates.guardianName;
    if (updates.guardianPhone) dbUpdates.guardian_phone = updates.guardianPhone;
    if (updates.homeAddress) dbUpdates.home_address = updates.homeAddress;

    // Send the update to Supabase
    const { data, error } = await supabaseAdmin
      .from('students')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Supabase PATCH Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, student: data }, { status: 200 });
  } catch (err) {
    console.error("Server Error in PATCH:", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

/**
 * DELETE: Runs when the Headteacher archives/removes a student
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Student ID is required for deletion." }, { status: 400 });
    }

    // Since student_history has a foreign key to students, 
    // Supabase will automatically delete the history rows if you set up "ON DELETE CASCADE".
    // Otherwise, you just delete the student and it's removed from the UI.
    const { error } = await supabaseAdmin
      .from('students')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Supabase DELETE Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Server Error in DELETE:", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}