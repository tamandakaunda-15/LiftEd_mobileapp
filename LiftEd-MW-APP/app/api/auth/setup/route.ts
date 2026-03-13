import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to check if a string is a valid UUID
const isValidUUID = (uuid: string) => {
  const re = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return re.test(uuid);
};

export async function POST(request: Request) {
  try {
    // Removed inviteCode from the destructuring
    const { userId, role, emisId, zoneId } = await request.json();

    // 1. CRITICAL CHECK: Ensure userId is a real UUID
    if (!userId || !isValidUUID(userId)) {
      return NextResponse.json({ 
        error: `Invalid User ID format. Received: ${userId}. Expected a UUID.` 
      }, { status: 400 });
    }

    // Protect against invalid roles hitting the API
    if (!role || (role !== "headteacher" && role !== "pea")) {
      return NextResponse.json({ error: "Invalid or missing role selection" }, { status: 400 });
    }

    let targetSchoolId = null;

    // --- HEADTEACHER SETUP ---
    if (role === "headteacher") {
      if (!emisId) throw new Error("EMIS ID is required for Headteachers.");

      let { data: school } = await supabaseAdmin
        .from('schools')
        .select('id')
        .eq('emis_id', emisId)
        .single();

      // Auto-create school if it doesn't exist
      if (!school) {
        const { data: newSchool, error: schoolError } = await supabaseAdmin
          .from('schools')
          .insert([{ 
            emis_id: emisId, 
            name: `School ${emisId}`, 
            zone_id: zoneId 
          }])
          .select('id').single();

        if (schoolError) throw schoolError;
        school = newSchool;
      }
      targetSchoolId = school.id;
    }

    // --- PEA SETUP ---
    if (role === "pea" && !zoneId) {
        throw new Error("Zone ID is required for District Officers (PEA).");
    }

    // --- FINAL PROFILE UPDATE ---
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        role: role.toUpperCase(),
        zone_id: zoneId || null,
        school_id: targetSchoolId
      })
      .eq('id', userId);

    if (profileError) throw profileError;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Setup Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}