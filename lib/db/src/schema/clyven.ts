import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  title: text("title").notNull().default("Untitled"),
  content: text("content").notNull().default(""),
  category: text("category"),
  tags: text("tags").array(),
  color: text("color").default("default"),
  isPinned: boolean("is_pinned").default(false),
  isFavorite: boolean("is_favorite").default(false),
  isArchived: boolean("is_archived").default(false),
  wordCount: integer("word_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bookmarks = pgTable("bookmarks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  url: text("url").notNull(),
  title: text("title"),
  description: text("description"),
  thumbnail: text("thumbnail"),
  siteName: text("site_name"),
  category: text("category"),
  tags: text("tags").array(),
  isFavorite: boolean("is_favorite").default(false),
  isReadLater: boolean("is_read_later").default(false),
  clickCount: integer("click_count").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const focusSessions = pgTable("focus_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  duration: integer("duration").notNull(),
  type: text("type").notNull().default("pomodoro"),
  label: text("label"),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const journalEntries = pgTable("journal_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  date: date("date").notNull(),
  mood: text("mood"),
  wentWell: text("went_well"),
  learned: text("learned"),
  grateful: text("grateful"),
  tomorrowGoals: text("tomorrow_goals"),
  freeText: text("free_text"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userAchievements = pgTable("user_achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  badgeId: text("badge_id").notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

export const userSettings = pgTable("user_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique(),
  theme: text("theme").default("dark"),
  dailyFocusGoal: integer("daily_focus_goal").default(120),
  notificationsEnabled: boolean("notifications_enabled").default(true),
  timezone: text("timezone").default("UTC"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertNoteSchema = createInsertSchema(notes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFocusSessionSchema = createInsertSchema(focusSessions).omit({ id: true, completedAt: true });
export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({ id: true, createdAt: true, updatedAt: true });

export type Note = typeof notes.$inferSelect;
export type Bookmark = typeof bookmarks.$inferSelect;
export type FocusSession = typeof focusSessions.$inferSelect;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
