import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// --- 1. GET ALL TEACHERS FOR THIS HEADTEACHER ---
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const headteacherId = searchParams.get('headteacherId');

    if (!headteacherId) return NextResponse.json({ teachers: [] });

    // Find the Headteacher's school
    const { data: htProfile } = await supabaseAdmin
      .from('profiles').select('school_id').eq('id', headteacherId).single();

    if (!htProfile?.school_id) return NextResponse.json({ teachers: [] });

    // Fetch all teachers in that school + their assigned class
    const { data: teachers, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        name,
        classes ( name )
      `)
      .eq('school_id', htProfile.school_id)
      .eq('role', 'TEACHER');

    if (error) throw error;
    return NextResponse.json({ teachers });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 });
  }
}

// --- 2. CREATE A TEACHER ---
export async function POST(request: Request) {
  try {
    const { name, email, standard, password, headteacherId } = await request.json();

    const { data: htProfile } = await supabaseAdmin
      .from('profiles').select('school_id').eq('id', headteacherId).single();

    const actualSchoolId = htProfile?.school_id;
    if (!actualSchoolId) throw new Error("Headteacher school not found.");

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { name }
    });
    if (authError) throw authError;

    const newUserId = authData.user.id;

    await supabaseAdmin.from('profiles').upsert({
      id: newUserId, name, role: 'TEACHER', school_id: actualSchoolId
    });

    await supabaseAdmin.from('classes').insert({
      name: `Standard ${standard}`, teacher_id: newUserId, school_id: actualSchoolId
    });

    return NextResponse.json({ success: true, teacherId: newUserId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- 3. REVOKE/DELETE A TEACHER ---
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');

    if (!teacherId) throw new Error("Teacher ID missing.");

    // Delete class assignment and profile
    await supabaseAdmin.from('classes').delete().eq('teacher_id', teacherId);
    await supabaseAdmin.from('profiles').delete().eq('id', teacherId);
    
    // Delete their actual login capability
    const { error } = await supabaseAdmin.auth.admin.deleteUser(teacherId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


// --- 4. UPDATE TEACHER PROFILE & ASSIGNMENT ---
export async function PATCH(request: Request) {
  try {
    const { teacherId, newStandard, newName, newEmail } = await request.json();

    if (!teacherId) throw new Error("Missing teacher ID.");

    // 1. Update Auth System (Email and Meta Name)
    if (newEmail || newName) {
      const authUpdates: any = {};
      if (newEmail) authUpdates.email = newEmail;
      if (newName) authUpdates.user_metadata = { name: newName };

      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        teacherId,
        authUpdates
      );
      if (authError) throw authError;
    }

    // 2. Update Public Profile (Name)
    if (newName) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ name: newName })
        .eq('id', teacherId);
      if (profileError) throw profileError;
    }

    // 3. Update Class Assignment
    if (newStandard) {
      const { error: classError } = await supabaseAdmin
        .from('classes')
        .update({ name: `Standard ${newStandard}` })
        .eq('teacher_id', teacherId);
      if (classError) throw classError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}