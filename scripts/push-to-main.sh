#!/bin/bash
# Führe diese Befehle im Replit-Shell-Tab aus (nicht im Agent)
# Dann werden alle Supabase-Änderungen auf main gepusht

echo "=== Schritt 1: Lösche Git-Lock (falls vorhanden) ==="
rm -f .git/ORIG_HEAD.lock .git/index.lock 2>/dev/null

echo "=== Schritt 2: Stelle sicher, wir sind auf main ==="
git checkout main 2>/dev/null || true

echo "=== Schritt 3: Merge backup-2677 (Supabase + Premium) in main ==="
git merge backup-2677 --no-edit --no-ff -m "Merge: Supabase-Integration + Premium-Features + Billing"

echo "=== Schritt 4: Push zu GitHub ==="
git push origin main

echo "=== Schritt 5: Verifiziere ==="
echo "Remote main jetzt bei:"
git log --oneline origin/main -3

echo ""
echo "=== FERTIG ✓ ==="
echo "Alle Änderungen sind jetzt auf main und GitHub!"
