import MetaApi from "metaapi.cloud-sdk/node";
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  // Wait for account to be deployed
  await account.deploy();
  await account.waitConnected();

  return account;
}

export async function syncAccountTrades(dbAccountId: string, metaApiAccountId: string) {
  const account = await api.metatraderAccountApi.getAccount(metaApiAccountId);
  
  // Wait for account to be deployed and connected with retries
  let retries = 5;
  while (retries > 0) {
    try {
      await account.waitConnected();
      break;
    } catch (error) {
      retries--;
      if (retries === 0) throw error;
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
    }
  }
  
  const connection = account.getRPCConnection();
  await connection.connect();
  await connection.waitSynchronized();

  // 1. Get current account information
  const accountInfo = await connection.getAccountInformation();
  await db.update(tradingAccounts)
    .set({
      balance: accountInfo.balance,
      equity: accountInfo.equity,
      currency: accountInfo.currency
    })
    .where(eq(tradingAccounts.id, dbAccountId));

  // 2. Get history (Last 90 days)
  const history = await connection.getHistoryOrdersByTimeRange(
    new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), 
    new Date()
  );

  // 3. Sync to DB
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const order of (history.historyOrders as any[] || [])) {
    if (order.profit !== undefined && order.openPrice !== undefined) {
      await db.insert(trades).values({
        accountId: dbAccountId,
        externalTradeId: order.id,
        symbol: order.symbol,
        type: order.type,
        volume: order.volume,
        openPrice: order.openPrice,
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
