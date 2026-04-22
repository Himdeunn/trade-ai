"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { tradingAccounts } from "@/lib/db/schema";
import { addMetaApiAccount, syncAccountTrades } from "@/lib/meta-service";
import { encrypt } from "@/lib/crypto";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";

export async function linkTradingAccount(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const login = formData.get("login") as string;
  const password = formData.get("password") as string;
  const server = formData.get("server") as string;
  const platform = formData.get("platform") as 'mt4' | 'mt5';

  try {
    // 1. Add to MetaApi
    const metaAccount = await addMetaApiAccount({
      name,
      login,
      password,
      server,
      platform,
    });

    // 2. Save to our DB
    const userId = session.user.id as string;
    const [dbAccount] = await db.insert(tradingAccounts).values({
      userId: userId,
      metaApiAccountId: metaAccount.id,
      accountNumber: login,
      broker: name, // User's label for the broker
      server: server,
      platform: platform,
      encryptedPassword: encrypt(password),
      apiKey: crypto.randomUUID(),
    }).returning();

    // 3. Initial sync
    await syncAccountTrades(dbAccount.id, metaAccount.id);

    revalidatePath("/dashboard");
    return { success: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Link Account Error:", error);
    return { success: false, error: error.message };
  }
}

export async function syncAllAccounts() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id as string;
  const accounts = await db.query.tradingAccounts.findMany({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    where: (table: any, { eq }: any) => eq(table.userId, userId),
  });

  for (const account of accounts) {
    if (!account.metaApiAccountId) continue; // Skip accounts managed via EA
    try {
      await syncAccountTrades(account.id, account.metaApiAccountId);
    } catch (error) {
      console.error(`Failed to sync account ${account.id}:`, error);
    }
  }

  revalidatePath("/dashboard");
}

export async function deleteTradingAccount(accountId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.delete(tradingAccounts)
    .where(and(
      eq(tradingAccounts.id, accountId),
      eq(tradingAccounts.userId, session.user.id as string)
    ));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
}

export async function createEAAccount(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const login = formData.get("login") as string;
  const server = formData.get("server") as string;
  const platform = formData.get("platform") as 'mt4' | 'mt5';

  try {
    const userId = session.user.id as string;
    await db.insert(tradingAccounts).values({
      userId: userId,
      accountNumber: login,
      broker: name,
      server: server,
      platform: platform,
      apiKey: crypto.randomUUID(),
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Create EA Account Error:", error);
    return { success: false, error: error.message };
  }
}
