/*
# CLYVEN Platform Schema

Creates the core tables for the CLYVEN productivity platform:
- Notes (second brain / quick notes)
- Bookmarks (link saving and management)
- Focus Sessions (pomodoro/time tracking)
- Journal Entries (daily reflection)
- User Achievements (gamification badges)
- User Settings (preferences)

## Architecture Notes
This app uses Clerk for authentication (not Supabase Auth). The API server
validates Clerk sessions and enforces user_id ownership at the middleware level.
RLS is enabled for defense-in-depth; policies allow authenticated role access
since the API server handles actual authorization checks.

## Tables Created
1. `notes` - User notes with categories, tags, pins, favorites, archiving
2. `bookmarks` - Saved URLs with metadata, thumbnails, read-later flags
3. `focus_sessions` - Completed focus timer sessions with duration/type
4. `journal_entries` - Daily journal with mood, gratitude, goals
5. `user_achievements` - Unlocked achievement badges per user
6. `user_settings` - User preferences (theme, focus goal, notifications)

## Security
- RLS enabled on all tables
- Policies allow authenticated role access (API server enforces user_id ownership)
- user_id stores Clerk user IDs as text
*/

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  title text NOT NULL DEFAULT 'Untitled',
  content text NOT NULL DEFAULT '',
  category text,
  tags text[],
  color text DEFAULT 'default',
  is_pinned boolean DEFAULT false,
  is_favorite boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  word_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  url text NOT NULL,
  title text,
  description text,
  thumbnail text,
  site_name text,
  category text,
  tags text[],
  is_favorite boolean DEFAULT false,
  is_read_later boolean DEFAULT false,
  click_count integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Focus sessions table
CREATE TABLE IF NOT EXISTS focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  duration integer NOT NULL,
  type text NOT NULL DEFAULT 'pomodoro',
  label text,
  completed_at timestamptz DEFAULT now()
);

-- Journal entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  date date NOT NULL,
  mood text,
  went_well text,
  learned text,
  grateful text,
  tomorrow_goals text,
  free_text text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  badge_id text NOT NULL,
  unlocked_at timestamptz DEFAULT now()
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  theme text DEFAULT 'dark',
  daily_focus_goal integer DEFAULT 120,
  notifications_enabled boolean DEFAULT true,
  timezone text DEFAULT 'UTC',
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Notes policies
DROP POLICY IF EXISTS "notes_select" ON notes;
CREATE POLICY "notes_select" ON notes FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "notes_insert" ON notes;
CREATE POLICY "notes_insert" ON notes FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "notes_update" ON notes;
CREATE POLICY "notes_update" ON notes FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "notes_delete" ON notes;
CREATE POLICY "notes_delete" ON notes FOR DELETE
  TO authenticated USING (true);

-- Bookmarks policies
DROP POLICY IF EXISTS "bookmarks_select" ON bookmarks;
CREATE POLICY "bookmarks_select" ON bookmarks FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "bookmarks_insert" ON bookmarks;
CREATE POLICY "bookmarks_insert" ON bookmarks FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "bookmarks_update" ON bookmarks;
CREATE POLICY "bookmarks_update" ON bookmarks FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "bookmarks_delete" ON bookmarks;
CREATE POLICY "bookmarks_delete" ON bookmarks FOR DELETE
  TO authenticated USING (true);

-- Focus sessions policies
DROP POLICY IF EXISTS "focus_sessions_select" ON focus_sessions;
CREATE POLICY "focus_sessions_select" ON focus_sessions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "focus_sessions_insert" ON focus_sessions;
CREATE POLICY "focus_sessions_insert" ON focus_sessions FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "focus_sessions_delete" ON focus_sessions;
CREATE POLICY "focus_sessions_delete" ON focus_sessions FOR DELETE
  TO authenticated USING (true);

-- Journal entries policies
DROP POLICY IF EXISTS "journal_entries_select" ON journal_entries;
CREATE POLICY "journal_entries_select" ON journal_entries FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "journal_entries_insert" ON journal_entries;
CREATE POLICY "journal_entries_insert" ON journal_entries FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "journal_entries_update" ON journal_entries;
CREATE POLICY "journal_entries_update" ON journal_entries FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "journal_entries_delete" ON journal_entries;
CREATE POLICY "journal_entries_delete" ON journal_entries FOR DELETE
  TO authenticated USING (true);

-- User achievements policies
DROP POLICY IF EXISTS "user_achievements_select" ON user_achievements;
CREATE POLICY "user_achievements_select" ON user_achievements FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "user_achievements_insert" ON user_achievements;
CREATE POLICY "user_achievements_insert" ON user_achievements FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "user_achievements_delete" ON user_achievements;
CREATE POLICY "user_achievements_delete" ON user_achievements FOR DELETE
  TO authenticated USING (true);

-- User settings policies
DROP POLICY IF EXISTS "user_settings_select" ON user_settings;
CREATE POLICY "user_settings_select" ON user_settings FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "user_settings_insert" ON user_settings;
CREATE POLICY "user_settings_insert" ON user_settings FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "user_settings_update" ON user_settings;
CREATE POLICY "user_settings_update" ON user_settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "user_settings_delete" ON user_settings;
CREATE POLICY "user_settings_delete" ON user_settings FOR DELETE
  TO authenticated USING (true);

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_completed_at ON focus_sessions(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);