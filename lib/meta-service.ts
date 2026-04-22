import MetaApi from "metaapi.cloud-sdk";
import { db } from "./db";
import { trades, tradingAccounts } from "./db/schema";
import { eq } from "drizzle-orm";

const token = process.env.META_API_TOKEN!;
const api = new MetaApi(token);

export async function addMetaApiAccount(params: {
  name: string;
  login: string;
  password: string;
  server: string;
  platform: 'mt4' | 'mt5';
}) {
  // Create account on MetaApi
  const account = await api.metatraderAccountApi.createAccount({
    name: params.name,
    type: 'cloud',
    login: params.login,
    password: params.password,
    server: params.server,
    platform: params.platform,
    application: 'MetaApi',
    magic: 0
  } as any);

  // Wait for account to be deployed
  await account.deploy();
  await account.waitConnected();

  return account;
}

export async function syncAccountTrades(dbAccountId: string, metaApiAccountId: string) {
  const account = await api.metatraderAccountApi.getAccount(metaApiAccountId);
  await account.waitConnected();
  
  const connection = account.getRPCConnection();
  await connection.connect();
  await connection.waitSynchronized();

  // Get history
  const history = await connection.getHistoryOrdersByTimeRange(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    new Date()
  );

  // Sync to DB
  for (const order of history.historyOrders as any[]) {
    // Check if trade already exists
    // Simplified for now: just insert if profit is not null (closed trades)
    if (order.profit !== undefined) {
      await db.insert(trades).values({
        accountId: dbAccountId,
        externalTradeId: order.id,
        symbol: order.symbol,
        type: order.type,
        volume: order.volume,
        openPrice: order.openPrice!,
        closePrice: order.closePrice,
        profit: order.profit,
        commission: order.commission,
        swap: order.swap,
        openTime: new Date(order.time),
        closeTime: order.doneTime ? new Date(order.doneTime) : null,
      }).onConflictDoNothing();
    }
  }
}
