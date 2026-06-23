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
    const users = await db("users")
      .leftJoin("assignments", "users.id = assignments.user_id")
      .leftJoin("markers", "assignments.marker_id = markers.id")
      .where("users.is_system_user", 0)
      .whereNotNull("users.email")
      .orderBy("users.created_at", "desc")
      .select(
        "users.id",
        "users.email",
        "users.name",
        "users.department",
        "users.status",
        "users.is_it_admin",
        "users.created_at",
        "markers.marker_number as assigned_cubicle"
      );

    console.log("Users fetched:", users.length, "records");
    console.log("First user:", users[0]);
    return NextResponse.json(users);
  } catch (error: any) {
    console.error("Users fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authHandler);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { email, name, department } = await req.json();

    // Validation
    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check for duplicate email
    const existing = await db("users").where("email", email).first();
    if (existing) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Create user
    const result = await db("users").insert({
      email,
      name,
      department: department || null,
      status: "active",
    });

    return NextResponse.json(
      { id: result[0], email, name, department },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("User creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}
