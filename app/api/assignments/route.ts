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
    // Get assignments without joins
    const assignments = await db("assignments")
      .select(
        "id",
        "user_id",
        "marker_id",
        "assigned_at",
        "source"
      )
      .orderBy("assigned_at", "desc");

    // Fetch related data separately (no joins to avoid QueryBuilder issues)
    const allUsers = await db("users").select("id", "email", "name");
    const allMarkers = await db("markers").select("id", "marker_number", "floor_plan_id");
    const allFloorPlans = await db("floor_plans").select("id", "building", "floor_number");

    const userIds = new Set(assignments.map((a: any) => a.user_id));
    const markerIds = new Set(assignments.map((a: any) => a.marker_id));

    const users = allUsers.filter((u: any) => userIds.has(u.id));
    const markers = allMarkers.filter((m: any) => markerIds.has(m.id));

    const floorPlanIds = new Set(markers.map((m: any) => m.floor_plan_id));
    const floorPlans = allFloorPlans.filter((f: any) => floorPlanIds.has(f.id));

    // Build lookup maps
    const userMap = new Map(users.map((u: any) => [u.id, u]));
    const markerMap = new Map(markers.map((m: any) => [m.id, m]));
    const floorPlanMap = new Map(floorPlans.map((f: any) => [f.id, f]));

    console.log("Users count:", users.length, "Markers count:", markers.length, "FloorPlans count:", floorPlans.length);
    console.log("Assignments count:", assignments.length);
    console.log("Sample assignment:", assignments[0]);
    console.log("User map size:", userMap.size);
    console.log("Marker map size:", markerMap.size);

    // Enrich assignments with related data
    const enriched = assignments.map((a: any) => {
      const user = userMap.get(a.user_id);
      const marker = markerMap.get(a.marker_id);
      const floorPlan = marker ? floorPlanMap.get(marker.floor_plan_id) : null;

      if (!user) console.warn("User not found for id:", a.user_id);
      if (!marker) console.warn("Marker not found for id:", a.marker_id);

      return {
        id: a.id,
        user_id: a.user_id,
        marker_id: a.marker_id,
        assigned_at: a.assigned_at,
        source: a.source,
        email: user?.email,
        name: user?.name,
        marker_number: marker?.marker_number,
        building: floorPlan?.building,
        floor_number: floorPlan?.floor_number,
      };
    });

    console.log("Enriched result sample:", enriched[0]);
    return NextResponse.json(enriched);
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
