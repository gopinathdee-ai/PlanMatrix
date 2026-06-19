import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { handler } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(handler);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // TODO: Query assignments from database
  return NextResponse.json([]);
}

export async function POST(req: any) {
  const session = await getServerSession(handler);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // TODO: Create assignment in database
  return NextResponse.json({}, { status: 201 });
}
