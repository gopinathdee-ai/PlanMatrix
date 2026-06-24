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
    const floorPlans = await db("floor_plans").orderBy("uploaded_at", "desc");

    // Get marker counts for each floor plan
    const plansWithCounts = await Promise.all(
      floorPlans.map(async (plan: any) => {
        const markerCount = await db("markers")
          .where("floor_plan_id", plan.id)
          .count({ count: "*" })
          .first();

        const occupiedCount = await db("markers")
          .leftJoin("assignments", "markers.id", "assignments.marker_id")
          .where("markers.floor_plan_id", plan.id)
          .whereNotNull("assignments.id")
          .count({ count: "*" })
          .first();

        return {
          ...plan,
          marker_count: markerCount?.count || 0,
          occupied_count: occupiedCount?.count || 0,
        };
      })
    );

    return NextResponse.json(plansWithCounts);
  } catch (error: any) {
    console.error("Floor plans fetch error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authHandler);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("pdf") as File;
    const building = formData.get("building") as string;
    const floorNumber = formData.get("floorNumber") as string;

    if (!file || !building || !floorNumber) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!file.type.includes("pdf")) {
      return NextResponse.json(
        { error: "File must be a PDF" },
        { status: 400 }
      );
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 50MB" },
        { status: 400 }
      );
    }

    // Check for duplicate building/floor combination
    const existing = await db("floor_plans")
      .where("building", building)
      .where("floor_number", floorNumber)
      .first();

    if (existing) {
      return NextResponse.json(
        { error: "Floor plan for this building/floor already exists" },
        { status: 400 }
      );
    }

    // Save file to disk
    const fs = require("fs").promises;
    const path = require("path");
    const uploadDir = process.env.PDF_STORAGE_PATH || "./public/pdfs";

    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (err) {
      // Directory might already exist
    }

    const filename = `${Date.now()}-${file.name}`;
    const filepath = path.join(uploadDir, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(filepath, buffer);

    // Save metadata to database
    const insertData = {
      building,
      floor_number: floorNumber,
      pdf_filename: filename,
      pdf_url: `/pdfs/${filename}`,
      created_by: session.user?.email || "unknown",
    };
    console.log("Inserting floor plan with data:", insertData);
    const result = await db("floor_plans").insert(insertData);
    console.log("Insert result:", result);

    return NextResponse.json(
      { id: result[0], building, floor_number: floorNumber },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Floor plan upload error:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
