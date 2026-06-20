import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { POST as authHandler } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authHandler);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const assignments = await db("assignments")
      .select(
        "assignments.id",
        "assignments.user_id",
        "assignments.marker_id",
        "assignments.assigned_at",
        "assignments.source",
        "users.email",
        "users.name",
        "markers.marker_number",
        "floor_plans.building",
        "floor_plans.floor_number"
      )
      .orderBy("assignments.assigned_at", "desc");

    return NextResponse.json(assignments);
  } catch (error: any) {
    console.error("Assignments fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authHandler);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { user_id, marker_id } = await req.json();

    if (!user_id || !marker_id) {
      return NextResponse.json(
        { error: "User ID and marker ID are required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db("users").where("id", user_id).first();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if marker exists
    const marker = await db("markers").where("id", marker_id).first();
    if (!marker) {
      return NextResponse.json({ error: "Marker not found" }, { status: 404 });
    }

    // Check if marker is already assigned
    const markerAssigned = await db("assignments")
      .where("marker_id", marker_id)
      .first();
    if (markerAssigned) {
      return NextResponse.json(
        { error: "This marker is already assigned" },
        { status: 400 }
      );
    }

    // Check if user is already assigned (if so, reassign)
    const userAssigned = await db("assignments")
      .where("user_id", user_id)
      .first();
    if (userAssigned) {
      const oldMarkerId = userAssigned.marker_id;
      await db("assignments").where("id", userAssigned.id).del();
      await db("assignment_history").insert({
        user_id,
        old_marker_id: oldMarkerId,
        new_marker_id: marker_id,
        action: "reassign",
        source: "manual",
      });
    } else {
      await db("assignment_history").insert({
        user_id,
        new_marker_id: marker_id,
        action: "assign",
        source: "manual",
      });
    }

    // Create assignment
    const result = await db("assignments").insert({
      user_id,
      marker_id,
      source: "manual",
    });

    return NextResponse.json(
      { id: result[0], user_id, marker_id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Assignment creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create assignment" },
      { status: 500 }
    );
  }
}
