import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { POST as authHandler } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string; markerId: string }> }
) {
  const params = await paramsPromise;
  const session = await getServerSession(authHandler);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { marker_number, pixel_x, pixel_y } = body;

    const markerId = params.markerId;
    const floorPlanId = params.id;

    // Check marker exists and belongs to this floor plan
    const marker = await db("markers")
      .where("id", markerId)
      .where("floor_plan_id", floorPlanId)
      .first();

    if (!marker) {
      return NextResponse.json(
        { error: "Marker not found" },
        { status: 404 }
      );
    }

    // Check for duplicate marker number (if changing)
    if (marker_number && marker_number !== marker.marker_number) {
      const existing = await db("markers")
        .where("floor_plan_id", floorPlanId)
        .where("marker_number", marker_number)
        .first();

      if (existing) {
        return NextResponse.json(
          { error: "Marker with this number already exists" },
          { status: 400 }
        );
      }
    }

    const updates: any = {};
    if (marker_number) updates.marker_number = marker_number;
    if (pixel_x !== undefined) updates.pixel_x = parseInt(pixel_x);
    if (pixel_y !== undefined) updates.pixel_y = parseInt(pixel_y);

    await db("markers").where("id", markerId).update(updates);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Marker update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update marker" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string; markerId: string }> }
) {
  const params = await paramsPromise;
  const session = await getServerSession(authHandler);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const markerId = params.markerId;
    const floorPlanId = params.id;

    // Check marker exists and belongs to this floor plan
    const marker = await db("markers")
      .where("id", markerId)
      .where("floor_plan_id", floorPlanId)
      .first();

    if (!marker) {
      return NextResponse.json(
        { error: "Marker not found" },
        { status: 404 }
      );
    }

    // Delete associated assignment if exists
    await db("assignments").where("marker_id", markerId).del();

    // Delete marker
    await db("markers").where("id", markerId).del();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Marker deletion error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete marker" },
      { status: 500 }
    );
  }
}
