import "server-only";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { POST as authHandler } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function GET(
  _req: any,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise;
  const session = await getServerSession(authHandler);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const floorPlanId = params.id;

    // Get floor plan
    const floorPlan = await db("floor_plans").where("id", floorPlanId).first();
    if (!floorPlan) {
      return NextResponse.json(
        { error: "Floor plan not found" },
        { status: 404 }
      );
    }

    // Get markers with assignment info
    const markers = await db("markers")
      .where("floor_plan_id", floorPlanId)
      .select(
        "markers.id",
        "markers.marker_number",
        "markers.pixel_x",
        "markers.pixel_y",
        "users.id as user_id",
        "users.email",
        "users.name"
      )
      .orderBy("markers.marker_number", "asc");

    return NextResponse.json({ floorPlan, markers });
  } catch (error: any) {
    console.error("Floor plan assign data fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
