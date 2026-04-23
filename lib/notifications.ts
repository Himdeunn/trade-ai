import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";

export async function createNotification({
  userId,
  title,
  message,
  type = "info",
}: {
  userId: string;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
}) {
  try {
    await db.insert(notifications).values({
      userId,
      title,
      message,
      type,
      isRead: 0,
    });
    return true;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return false;
  }
}
