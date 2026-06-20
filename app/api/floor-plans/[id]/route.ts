import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { POST as authHandler } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise;
  const session = await getServerSession(authHandler);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const floorPlanId = params.id;

    // Check if floor plan exists
    const floorPlan = await db("floor_plans")
      .where("id", floorPlanId)
      .first();

    if (!floorPlan) {
      return NextResponse.json(
        { error: "Floor plan not found" },
        { status: 404 }
      );
    }

    // Delete associated assignments first
    const markers = await db("markers")
      .where("floor_plan_id", floorPlanId)
      .select("id");

    for (const marker of markers) {
      await db("assignments")
        .where("marker_id", marker.id)
        .del();
    }

    // Delete markers
    await db("markers")
      .where("floor_plan_id", floorPlanId)
      .del();

    // Delete floor plan
    await db("floor_plans")
      .where("id", floorPlanId)
      .del();

    // Delete PDF file
    const fs = require("fs").promises;
    const path = require("path");
    const uploadDir = process.env.PDF_STORAGE_PATH || "./public/pdfs";
    const filepath = path.join(uploadDir, floorPlan.pdf_filename);

    try {
      await fs.unlink(filepath);
    } catch (err) {
      // File might not exist, that's okay
      console.warn("Could not delete PDF file:", err);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Floor plan delete error:", error);
    return NextResponse.json(
      { error: error.message || "Delete failed" },
      { status: 500 }
    );
  }
}
