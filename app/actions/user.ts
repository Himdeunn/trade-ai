"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const fullName = formData.get("fullName") as string;
  const phoneNumber = formData.get("phoneNumber") as string;
  const name = formData.get("name") as string;
  const avatar = formData.get("avatar") as string;

  try {
    await db.update(users)
      .set({
        fullName,
        phoneNumber,
        name,
        avatar,
      })
      .where(eq(users.id, session.user.id as string));

    revalidatePath("/dashboard/profile");
    return { success: true };
  } catch (error: any) {
    console.error("Update Profile Error:", error);
    return { success: false, error: error.message };
  }
}
