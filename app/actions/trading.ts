"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { tradingAccounts } from "@/lib/db/schema";
import { addMetaApiAccount, syncAccountTrades } from "@/lib/meta-service";
import { encrypt } from "@/lib/crypto";
import { revalidatePath } from "next/cache";

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
    const [dbAccount] = await db.insert(tradingAccounts).values({
      userId: session.user.id,
      metaApiAccountId: metaAccount.id,
      accountNumber: login,
      broker: name, // User's label for the broker
      server: server,
      platform: platform,
      encryptedPassword: encrypt(password),
    }).returning();

    // 3. Initial sync
    await syncAccountTrades(dbAccount.id, metaAccount.id);

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Link Account Error:", error);
    return { success: false, error: error.message };
  }
}

export async function syncAllAccounts() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const accounts = await db.query.tradingAccounts.findMany({
    where: (table, { eq }) => eq(table.userId, session.user.id),
  });

  for (const account of accounts) {
    try {
      await syncAccountTrades(account.id, account.metaApiAccountId);
    } catch (error) {
      console.error(`Failed to sync account ${account.id}:`, error);
    }
  }

  revalidatePath("/dashboard");
}
