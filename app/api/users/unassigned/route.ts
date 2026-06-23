import "server-only";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { POST as authHandler } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authHandler);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Get all users
    const allUsers = await db("users")
      .where("status", "active")
      .where("is_system_user", 0)
      .select("id", "email", "name");

    // Get assigned user IDs
    const assignments = await db("assignments").select("user_id");
    const assignedUserIds = new Set(assignments.map((a: any) => a.user_id));

    // Filter to unassigned users
    const unassignedUsers = allUsers.filter(
      (u: any) => !assignedUserIds.has(u.id)
    );

    return NextResponse.json(unassignedUsers);
  } catch (error: any) {
    console.error("Unassigned users fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
