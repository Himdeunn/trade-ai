import {
  pgTable,
  text,
  timestamp,
  integer,
  doublePrecision,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password"),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tradingAccounts = pgTable("trading_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  metaApiAccountId: text("meta_api_account_id").notNull(),
  accountNumber: text("account_number").notNull(),
  broker: text("broker").notNull(),
  server: text("server").notNull(),
  platform: text("platform").notNull(), // 'mt4' or 'mt5'
  encryptedPassword: text("encrypted_password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const trades = pgTable("trades", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id")
    .references(() => tradingAccounts.id, { onDelete: "cascade" })
    .notNull(),
  externalTradeId: text("external_trade_id").notNull(),
  symbol: text("symbol").notNull(),
  type: text("type").notNull(), // 'buy', 'sell'
  volume: doublePrecision("volume").notNull(),
  openPrice: doublePrecision("open_price").notNull(),
  closePrice: doublePrecision("close_price"),
  profit: doublePrecision("profit"),
  commission: doublePrecision("commission"),
  swap: doublePrecision("swap"),
  openTime: timestamp("open_time").notNull(),
  closeTime: timestamp("close_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
