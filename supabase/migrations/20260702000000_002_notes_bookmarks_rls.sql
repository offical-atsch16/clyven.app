-- SQL Skript zur Konfiguration von RLS Policies für Notizen und Bookmarks

-- 1. Tabellen-RLS aktivieren
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- 2. Policies für Notes
DROP POLICY IF EXISTS "Users can manage their own notes" ON public.notes;
DROP POLICY IF EXISTS "notes_select" ON public.notes;
DROP POLICY IF EXISTS "notes_insert" ON public.notes;
DROP POLICY IF EXISTS "notes_update" ON public.notes;
DROP POLICY IF EXISTS "notes_delete" ON public.notes;

CREATE POLICY "Users can manage their own notes" ON public.notes
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- 3. Policies für Bookmarks
DROP POLICY IF EXISTS "Users can manage their own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "bookmarks_select" ON public.bookmarks;
DROP POLICY IF EXISTS "bookmarks_insert" ON public.bookmarks;
DROP POLICY IF EXISTS "bookmarks_update" ON public.bookmarks;
DROP POLICY IF EXISTS "bookmarks_delete" ON public.bookmarks;

CREATE POLICY "Users can manage their own bookmarks" ON public.bookmarks
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);
