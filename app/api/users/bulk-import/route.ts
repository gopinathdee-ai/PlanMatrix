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

    // Get existing emails for faster duplicate check
    const existingEmails = await db("users").select("email");
    const existingEmailSet = new Set(existingEmails.map((u: any) => u.email));

    // Process each row
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNum = i + 2; // +2 because row 1 is headers

      try {
        const { email, name, department } = record;

        // Validate required fields
        if (!email || !name) {
          results.error_count++;
          results.errors.push({
            row: rowNum,
            email: email || "missing",
            error: "Email and name are required",
          });
          continue;
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          results.error_count++;
          results.errors.push({
            row: rowNum,
            email,
            error: "Invalid email format",
          });
          continue;
        }

        // Duplicate check
        if (existingEmailSet.has(email)) {
          results.error_count++;
          results.errors.push({
            row: rowNum,
            email,
            error: "User with this email already exists",
          });
          continue;
        }

        // Create user
        await db("users").insert({
          email,
          name,
          department: department || null,
          status: "active",
        });

        existingEmailSet.add(email);
        results.success_count++;
      } catch (error: any) {
        results.error_count++;
        results.errors.push({
          row: rowNum,
          email: record.email || "unknown",
          error: error.message || "Failed to create user",
        });
      }
    }

    // Log import
    await db("import_logs").insert({
      type: "users",
      filename: file.name,
      success_count: results.success_count,
      error_count: results.error_count,
      errors: results.error_count > 0 ? JSON.stringify(results.errors) : null,
    });

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Bulk import error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to import users" },
      { status: 500 }
    );
  }
}
