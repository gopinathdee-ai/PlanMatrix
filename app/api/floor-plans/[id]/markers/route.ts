import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { POST as authHandler } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise;
  const session = await getServerSession(authHandler);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const floorPlanId = params.id;

    // Get all markers
    const markers = await db("markers")
      .where("floor_plan_id", floorPlanId)
      .select(
        "id",
        "marker_number",
        "pixel_x",
        "pixel_y",
        "pdf_page_number",
        "created_at"
      );

    // Get all assignments
    const assignments = await db("assignments").select("marker_id", "user_id");

    // Get all users
    const users = await db("users").select("id", "email", "name");

    // Build lookup maps
    const userMap = new Map(users.map((u: any) => [u.id, u]));
    const assignmentMap = new Map(assignments.map((a: any) => [a.marker_id, a.user_id]));

    // Enrich markers with assignment info
    const enriched = markers.map((m: any) => {
      const userId = assignmentMap.get(m.id);
      const user = userId ? userMap.get(userId) : null;

      return {
        ...m,
        assigned_user_name: user?.name || null,
        assigned_user_email: user?.email || null,
      };
    });

    return NextResponse.json(enriched);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise;
  const session = await getServerSession(authHandler);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { marker_number, pixel_x, pixel_y, pdf_page_number } = body;

    if (!marker_number || pixel_x === undefined || pixel_y === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const floorPlanId = params.id;

    // Check for duplicate marker number on same floor plan
    const existing = await db("markers")
      .where("floor_plan_id", floorPlanId)
      .where("marker_number", marker_number)
      .first();

    if (existing) {
      return NextResponse.json(
        { error: "Marker with this number already exists on this floor plan" },
        { status: 400 }
      );
    }

    // Create marker
    const result = await db("markers").insert({
      floor_plan_id: floorPlanId,
      marker_number,
      pixel_x: parseInt(pixel_x),
      pixel_y: parseInt(pixel_y),
      pdf_page_number: pdf_page_number || 1,
    });

    return NextResponse.json(
      { id: result[0], marker_number, pixel_x: parseInt(pixel_x), pixel_y: parseInt(pixel_y) },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Marker creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create marker" },
      { status: 500 }
    );
  }
}
