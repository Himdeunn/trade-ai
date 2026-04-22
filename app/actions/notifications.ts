"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notifications, users } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getNotifications() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const userId = session.user.id as string;

  return await db.query.notifications.findMany({
    where: (table, { eq }) => eq(table.userId, userId),
    orderBy: [desc(notifications.createdAt)],
    limit: 50,
  });
}

export async function markAsRead(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  const userId = session.user.id as string;

  await db.update(notifications)
    .set({ isRead: 1 })
    .where(and(
      eq(notifications.id, notificationId),
      eq(notifications.userId, userId)
    ));

  revalidatePath("/dashboard/notifications");
}

export async function markAllAsRead() {
  const session = await auth();
  if (!session?.user?.id) return;

  const userId = session.user.id as string;

  await db.update(notifications)
    .set({ isRead: 1 })
    .where(eq(notifications.userId, userId));

  revalidatePath("/dashboard/notifications");
}

export async function updateNotificationSettings(settings: {
  notifyDaily: number;
  notifyAi: number;
  notifyTrades: number;
  notifyWeekly: number;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id as string;

  await db.update(users)
    .set(settings)
    .where(eq(users.id, userId));

  revalidatePath("/dashboard/settings");
  return { success: true };
}

// Utility to create notification (can be used in background)
export async function createNotification({
  userId,
  title,
  message,
  type = "info"
}: {
  userId: string;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
}) {
  await db.insert(notifications).values({
    userId,
    title,
    message,
    type,
  });
}
