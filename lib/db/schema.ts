import {
  pgTable,
  text,
  timestamp,
  integer,
  doublePrecision,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password"),
  name: text("name"),
  fullName: text("full_name"),
  phoneNumber: text("phone_number"),
  avatar: text("avatar").default("avatar-1"),
  role: text("role").default("member"),
  twoFactorEnabled: integer("two_factor_enabled").default(0),
  twoFactorSecret: text("two_factor_secret"),
  recoveryPhrase: text("recovery_phrase"),
  notifyDaily: integer("notify_daily").default(1),
  notifyAi: integer("notify_ai").default(1),
  notifyTrades: integer("notify_trades").default(1),
  notifyWeekly: integer("notify_weekly").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tradingAccounts = pgTable("trading_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  metaApiAccountId: text("meta_api_account_id"), // Optional for EA-only accounts
  accountNumber: text("account_number").notNull(),
  broker: text("broker").notNull(),
  server: text("server").notNull(),
  platform: text("platform").notNull(), // 'mt4' or 'mt5'
  encryptedPassword: text("encrypted_password"), // Optional for EA-only accounts
  apiKey: text("api_key").notNull().unique(), // Key for EA to send data
  balance: doublePrecision("balance").default(0),
  equity: doublePrecision("equity").default(0),
  currency: text("currency").default("USD"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const trades = pgTable("trades", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id")
    .references(() => tradingAccounts.id, { onDelete: "cascade" })
    .notNull(),
  externalTradeId: text("external_trade_id").notNull(),
  symbol: text("symbol").notNull(),
  type: text("type").notNull(), // 'buy', 'sell', 'balance'
  volume: doublePrecision("volume").notNull(),
  openPrice: doublePrecision("open_price").notNull(),
  closePrice: doublePrecision("close_price"),
  profit: doublePrecision("profit"),
  commission: doublePrecision("commission"),
  swap: doublePrecision("swap"),
  openTime: timestamp("open_time").notNull(),
  closeTime: timestamp("close_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqAccountExternal: uniqueIndex('uq_trades_ext_account')
    .on(table.accountId, table.externalTradeId),
}));

export const aiAnalyses = pgTable("ai_analyses", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id")
    .references(() => tradingAccounts.id, { onDelete: "cascade" })
    .notNull(),
  content: text("content").notNull(),
  score: integer("score"),
  category: text("category"), // e.g., 'Weekly Summary', 'Psychology'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").default("info"), // 'info', 'success', 'warning', 'error'
  isRead: integer("is_read").default(0), // 0: false, 1: true
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
