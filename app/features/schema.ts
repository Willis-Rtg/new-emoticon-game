import {
  bigint,
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const userTable = pgTable("users", {
  id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp().notNull().defaultNow(),
});

export const emoticonsTable = pgTable("emoticons", {
  id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  image_url: text("image_url").notNull(),
  popular: bigint({ mode: "number" }).notNull().default(0),
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp().notNull().defaultNow(),
});

export const emoticonsTags = pgTable("emoticons_tags", {
  id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  emoticon_id: bigint({ mode: "number" }).references(() => emoticonsTable.id, {
    onDelete: "set null",
  }),
  tag_id: bigint({ mode: "number" }).references(() => tagTable.id, {
    onDelete: "set null",
  }),
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp().notNull().defaultNow(),
});

export const tagTable = pgTable("tags", {
  id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull().unique(),
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp().notNull().defaultNow(),
});

export const gamesEmoticons = pgTable("games_emoticons", {
  id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  game_id: bigint({ mode: "number" }).references(() => gamesTable.id, {
    onDelete: "cascade",
  }),
  emoticon_id: bigint({ mode: "number" }).references(() => emoticonsTable.id, {
    onDelete: "set null",
  }),
  score: jsonb()
    .notNull()
    .default({ 친절함: 0, 사회성: 0, 매력적: 0, 센스함: 0, 똑똑함: 0 }),
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp().notNull().defaultNow(),
});

export const gamesTable = pgTable("games", {
  id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull().unique(),
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp().notNull().defaultNow(),
});

export const messagesTable = pgTable("messages", {
  id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  game_id: bigint({ mode: "number" }).references(() => gamesTable.id, {
    onDelete: "cascade",
  }),
  content: text("content").notNull(),
  is_me: boolean("is_me").notNull().default(false),
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp().notNull().defaultNow(),
});
