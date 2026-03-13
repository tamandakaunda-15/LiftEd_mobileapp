// app/api/teacher/students/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');

    if (!teacherId) {
      return NextResponse.json({ error: "Teacher ID required" }, { status: 400 });
    }

    // STEP 1: Find out which class this teacher is assigned to
    const { data: teacherClass, error: classError } = await supabaseAdmin
      .from('classes')
      .select('id, name, school_id')
      .eq('teacher_id', teacherId)
      .single();

    if (classError || !teacherClass) {
      return NextResponse.json({ students: [] });
    }

    const standardNumber = teacherClass.name.replace("Standard ", "");

    // STEP 2: Fetch students + their longitudinal history (15 predictors over time)
    const { data: students, error: studentError } = await supabaseAdmin
      .from('students')
      .select(`
        id,
        first_name,
        last_name,
        age,
        gender,
        risk_level,
        risk_score,
        student_history!student_history_student_id_fkey (*)
      `)
      .eq('school_id', teacherClass.school_id)
      .eq('standard', standardNumber);

    if (studentError) throw studentError;

    return NextResponse.json({ 
      className: teacherClass.name,
      students: students 
    });

  } catch (error: any) {
    console.error("Roster Fetch Error:", error);
    return NextResponse.json({ error: "Failed to load roster" }, { status: 500 });
  }
}