"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  if (!email || !password || !name) {
    return { success: false, error: "All fields are required" };
  }

  try {
    // Check if user exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, email));
    if (existingUser) {
      return { success: false, error: "Email already registered" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await db.insert(users).values({
      email,
      password: hashedPassword,
      name,
    });

    return { success: true };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Signup Error:", error);
    return { success: false, error: error.message };
  }
}
