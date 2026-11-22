#!/usr/bin/env python3
"""Rename ToolForge → DigiTools across the project.
Conservative: only rewrites source files we explicitly list.
Preserves 'toolforge-locale' as the localStorage key for backwards compat
(so existing users keep their language preference)."""
import re
from pathlib import Path

ROOT = Path("/home/z/my-project")

# Files to rewrite (relative paths). The locale storage key stays as-is so
# existing users don't lose their language preference after the rename.
FILES = [
    "src/app/layout.tsx",
    "src/messages/en.json",
    "src/messages/fr.json",
    "public/robots.txt",
    "Caddyfile",
]

# Replacement table. We preserve 'toolforge-locale' on purpose.
# The frontend (AppShell, i18n-context) already reads "toolforge-locale" so
# existing users keep their settings.
REPLACEMENTS = [
    # Display name
    ("ToolForge", "DigiTools"),
    ("Toolforge", "DigiTools"),
    ("toolforge", "digitools"),
    # IMPORTANT: keep the localStorage key stable to preserve user preference
    ("toolforge-locale", "toolforge-locale"),  # no-op (preserved)
]

# Files where we DON'T want to keep the storage key preserved (full rewrite):
# We'll process the storage key specially below.

for rel in FILES:
    p = ROOT / rel
    if not p.exists():
        print(f"  [skip] {rel} (missing)")
        continue
    text = p.read_text(encoding="utf-8")
    original = text
    # We must NOT accidentally change "toolforge-locale" — so we do the
    # case-sensitive ToolForge → DigiTools first, which is the display name.
    # Then toolforge → digitools, but only when NOT part of 'toolforge-locale'.
    text = text.replace("ToolForge", "DigiTools")
    text = text.replace("Toolforge", "DigiTools")
    # For lowercase 'toolforge', preserve the storage key:
    # Replace 'toolforge-locale' with a sentinel, replace 'toolforge', restore.
    SENTINEL = "\x00LOCALEKEY\x00"
    text = text.replace("toolforge-locale", SENTINEL)
    text = text.replace("toolforge", "digitools")
    text = text.replace(SENTINEL, "toolforge-locale")
    if text != original:
        p.write_text(text, encoding="utf-8")
        print(f"  [updated] {rel}")
    else:
        print(f"  [unchanged] {rel}")

print("\nDone. Note: 'toolforge-locale' localStorage key preserved for backwards compatibility.")
