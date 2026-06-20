import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { POST as authHandler } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { parse } from "csv-parse/sync";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authHandler);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const results = {
      success_count: 0,
      error_count: 0,
      errors: [] as any[],
    };

    // Get all existing data for faster lookups
    const floors = await db("floor_plans").select("id", "building", "floor_number");
    const markers = await db("markers").select("id", "marker_number", "floor_plan_id");
    const users = await db("users").select("id", "email");
    const assignments = await db("assignments").select("user_id", "marker_id");

    const userMap = new Map(users.map((u: any) => [u.email, u.id]));
    const assignedUsers = new Set(assignments.map((a: any) => a.user_id));
    const assignedMarkers = new Set(assignments.map((a: any) => a.marker_id));

    // Build marker lookup by building/floor/marker_number
    const markerLookup = new Map<string, any>();
    for (const floor of floors) {
      const floorMarkers = markers.filter(
        (m: any) => m.floor_plan_id === floor.id
      );
      for (const marker of floorMarkers) {
        const key = `${floor.building}|${floor.floor_number}|${marker.marker_number}`;
        markerLookup.set(key, marker);
      }
    }

    // Process each row
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNum = i + 2;

      try {
        const { building, floor, marker_number, user_email } = record;

        // Validate required fields
        if (!building || !floor || !marker_number || !user_email) {
          results.error_count++;
          results.errors.push({
            row: rowNum,
            user_email: user_email || "missing",
            marker_number: marker_number || "missing",
            error: "All fields (building, floor, marker_number, user_email) are required",
          });
          continue;
        }

        // Find marker
        const markerKey = `${building}|${floor}|${marker_number}`;
        const marker = markerLookup.get(markerKey);
        if (!marker) {
          results.error_count++;
          results.errors.push({
            row: rowNum,
            user_email,
            marker_number,
            error: `Marker not found for ${building}/${floor}/${marker_number}`,
          });
          continue;
        }

        // Find user
        const userId = userMap.get(user_email);
        if (!userId) {
          results.error_count++;
          results.errors.push({
            row: rowNum,
            user_email,
            marker_number,
            error: "User not found",
          });
          continue;
        }

        // Check if marker is already assigned
        if (assignedMarkers.has(marker.id)) {
          results.error_count++;
          results.errors.push({
            row: rowNum,
            user_email,
            marker_number,
            error: "Marker is already assigned",
          });
          continue;
        }

        // Check if user is already assigned (allow reassignment in bulk)
        if (assignedUsers.has(userId)) {
          // Find old assignment and remove it
          const oldAssignment = await db("assignments")
            .where("user_id", userId)
            .first();
          if (oldAssignment) {
            await db("assignments").where("id", oldAssignment.id).del();
            assignedMarkers.delete(oldAssignment.marker_id);

            // Log reassignment
            await db("assignment_history").insert({
              user_id: userId,
              old_marker_id: oldAssignment.marker_id,
              new_marker_id: marker.id,
              action: "reassign",
              source: "bulk-csv",
            });
          }
        } else {
          // Log new assignment
          await db("assignment_history").insert({
            user_id: userId,
            new_marker_id: marker.id,
            action: "assign",
            source: "bulk-csv",
          });
        }

        // Create assignment
        await db("assignments").insert({
          user_id: userId,
          marker_id: marker.id,
          source: "bulk-csv",
        });

        assignedUsers.add(userId);
        assignedMarkers.add(marker.id);
        results.success_count++;
      } catch (error: any) {
        results.error_count++;
        results.errors.push({
          row: rowNum,
          user_email: record.user_email || "unknown",
          marker_number: record.marker_number || "unknown",
          error: error.message || "Failed to create assignment",
        });
      }
    }

    // Log import
    await db("import_logs").insert({
      type: "assignments",
      filename: file.name,
      success_count: results.success_count,
      error_count: results.error_count,
      errors: results.error_count > 0 ? JSON.stringify(results.errors) : null,
    });

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Bulk assignment import error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to import assignments" },
      { status: 500 }
    );
  }
}
