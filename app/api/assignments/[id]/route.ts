import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { POST as authHandler } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise;
  const session = await getServerSession(authHandler);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { marker_id } = await req.json();
    const assignmentId = params.id;

    if (!marker_id) {
      return NextResponse.json(
        { error: "Marker ID is required" },
        { status: 400 }
      );
    }

    // Get current assignment
    const assignment = await db("assignments")
      .where("id", assignmentId)
      .first();
    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Check if new marker exists
    const marker = await db("markers").where("id", marker_id).first();
    if (!marker) {
      return NextResponse.json({ error: "Marker not found" }, { status: 404 });
    }

    // Check if new marker is already assigned
    const markerAssigned = await db("assignments")
      .where("marker_id", marker_id)
      .where("id", "!=", assignmentId)
      .first();
    if (markerAssigned) {
      return NextResponse.json(
        { error: "This marker is already assigned" },
        { status: 400 }
      );
    }

    const oldMarkerId = assignment.marker_id;
    const userId = assignment.user_id;

    // Update assignment
    await db("assignments").where("id", assignmentId).update({
      marker_id,
    });

    // Log reassignment
    await db("assignment_history").insert({
      user_id: userId,
      old_marker_id: oldMarkerId,
      new_marker_id: marker_id,
      action: "reassign",
      source: "manual",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Assignment update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update assignment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise;
  const session = await getServerSession(authHandler);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const assignmentId = params.id;

    // Get assignment
    const assignment = await db("assignments")
      .where("id", assignmentId)
      .first();
    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    const userId = assignment.user_id;
    const markerId = assignment.marker_id;

    // Delete assignment
    await db("assignments").where("id", assignmentId).del();

    // Log removal
    await db("assignment_history").insert({
      user_id: userId,
      old_marker_id: markerId,
      action: "remove",
      source: "manual",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Assignment deletion error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete assignment" },
      { status: 500 }
    );
  }
}
