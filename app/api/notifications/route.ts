import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await db.query.notifications.findMany({
      where: eq(notifications.userId, session.user.id as string),
      orderBy: [desc(notifications.createdAt)],
      limit: 20,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Notifications API Error:", error);
    // Return empty array instead of 500 to prevent UI crashes during DB hiccups
    return NextResponse.json([]);
  }
}
