import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  date,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").default(""),
  status: text("status").notNull().default("TODO"),
  priority: text("priority").notNull().default("MEDIUM"),
  tags: text("tags").array(),
  subtasks: jsonb("subtasks").default([]),
  timeSpent: integer("time_spent").default(0),
  timerStartedAt: timestamp("timer_started_at"),
  customFields: jsonb("custom_fields").default([]),
  startDate: date("start_date"),
  dueDate: date("due_date"),
  notified: boolean("notified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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

export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  noteId: uuid("note_id").notNull(),
  userId: text("user_id").notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  plan: text("plan").notNull(),
  status: text("status").notNull().default("active"),
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
  taskEmailsEnabled: boolean("task_emails_enabled").default(true),
  journalRemindersEnabled: boolean("journal_reminders_enabled").default(true),
  streakAlertsEnabled: boolean("streak_alerts_enabled").default(true),
  timezone: text("timezone").default("UTC"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique(),
  emailReminders: boolean("email_reminders").default(true),
  emailJournal: boolean("email_journal").default(true),
  emailStreaks: boolean("email_streaks").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  isSubscribed: boolean("is_subscribed").default(true),
  subscribedAt: timestamp("subscribed_at").defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at"),
});

export const supportStaff = pgTable("support_staff", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("agent"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const supportAuditLogs = pgTable("support_audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  staffId: uuid("staff_id"),
  staffName: text("staff_name").notNull(),
  action: text("action").notNull(),
  ticketId: uuid("ticket_id"),
  details: jsonb("details").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNoteSchema = createInsertSchema(notes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAttachmentSchema = createInsertSchema(attachments).omit({ id: true, createdAt: true });
export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFocusSessionSchema = createInsertSchema(focusSessions).omit({ id: true, completedAt: true });
export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({ id: true, updatedAt: true });
export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({ id: true, subscribedAt: true, unsubscribedAt: true });
export const insertSupportStaffSchema = createInsertSchema(supportStaff).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSupportAuditLogSchema = createInsertSchema(supportAuditLogs).omit({ id: true, createdAt: true });

export type Task = typeof tasks.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Bookmark = typeof bookmarks.$inferSelect;
export type FocusSession = typeof focusSessions.$inferSelect;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type SupportStaff = typeof supportStaff.$inferSelect;
export type SupportAuditLog = typeof supportAuditLogs.$inferSelect;

export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  email: text("email"),
  fullName: text("full_name"),
  role: text("role").default("user"),
  plan: text("plan").notNull().default("free"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const systemBanners = pgTable("system_banners", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"),
  isActive: boolean("is_active").notNull().default(true),
  targetRoute: text("target_route").notNull().default("*"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const systemSettings = pgTable("system_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull().default({}),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const featureFlags = pgTable("feature_flags", {
  id: uuid("id").primaryKey().defaultRandom(),
  flagKey: text("flag_key").notNull().unique(),
  description: text("description"),
  isEnabledGlobally: boolean("is_enabled_globally").notNull().default(false),
  allowedUserIds: jsonb("allowed_user_ids").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Profile = typeof profiles.$inferSelect;
export type SystemBanner = typeof systemBanners.$inferSelect;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type FeatureFlag = typeof featureFlags.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
