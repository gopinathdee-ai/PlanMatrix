import "server-only";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { POST as authHandler } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authHandler);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get total floor plans
    const floorPlans = await db("floor_plans").count().first();
    const totalFloorPlans = floorPlans?.count || 0;

    // Get total markers (cubicles)
    const markers = await db("markers").count().first();
    const totalCubicles = markers?.count || 0;

    // Get occupied cubicles (unique markers with assignments)
    const assignments = await db("assignments").count().first();
    const occupiedCubicles = assignments?.count || 0;

    // Calculate available cubicles
    const availableCubicles = totalCubicles - occupiedCubicles;

    // Calculate occupancy rate
    const occupancyRate = totalCubicles > 0
      ? Math.round((occupiedCubicles / totalCubicles) * 100)
      : 0;

    // Get total users (excluding system users)
    const users = await db("users").where("is_system_user", 0).count().first();
    const totalUsers = users?.count || 0;

    return NextResponse.json({
      totalFloorPlans,
      totalCubicles,
      occupiedCubicles,
      availableCubicles,
      occupancyRate,
      totalUsers,
    });
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
