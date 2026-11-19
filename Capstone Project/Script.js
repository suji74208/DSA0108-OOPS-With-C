"""Small SQLite repository for the local lost-and-found application."""

from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from lib.dates import today_iso


DB_PATH = Path(__file__).parent.parent / "data" / "lost_and_found.db"


def connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    with connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_type TEXT NOT NULL CHECK(item_type IN ('lost', 'found')),
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                item_date TEXT NOT NULL,
                location TEXT NOT NULL,
                contact_name TEXT NOT NULL DEFAULT '',
                contact_email TEXT NOT NULL DEFAULT '',
                student_id TEXT NOT NULL DEFAULT '',
                storage_location TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL DEFAULT 'pending',
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_items_type ON items(item_type)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_items_status ON items(status)")
        if conn.execute("SELECT COUNT(*) FROM items").fetchone()[0] == 0:
            seed_items = [
                ("lost", "MacBook Air M2 with stickers", "Electronics", "Silver laptop with two green stickers and a navy sleeve.", today_iso(), "Main Library, 2nd floor", "Aarav Mehta", "aarav@example.edu", "STU-2041", "", "pending"),
                ("found", "Silver MacBook laptop", "Electronics", "Silver laptop found beside the study tables; green sticker on the lid.", today_iso(), "Main Library Help Desk", "Maya Chen", "maya@example.edu", "STU-1182", "Security Office", "matched"),
                ("lost", "Navy blue Hydro Flask", "Bottles & Tumblers", "32oz navy bottle with a small campus crest decal.", today_iso(), "Student Union, ground floor", "Priya Shah", "priya@example.edu", "STU-3320", "", "pending"),
                ("found", "Navy Hydro Flask bottle", "Bottles & Tumblers", "Navy insulated bottle with a campus crest, found near the café.", today_iso(), "Student Union Café", "Jordan Bell", "jordan@example.edu", "STU-0914", "Campus Help Desk", "matched"),
                ("lost", "Engineering student ID card", "ID & Cards", "University ID in a clear sleeve; name is visible on the front.", today_iso(), "Engineering Building, Lab 3", "Noah Williams", "noah@example.edu", "STU-4108", "", "returned"),
                ("found", "Black leather wallet", "Wallets & Cards", "Slim black leather wallet with two cards inside.", today_iso(), "Campus Quad", "Sam Rivera", "sam@example.edu", "STU-2755", "Campus Security", "claimed"),
            ]
            conn.executemany(
                """
                INSERT INTO items (item_type, name, category, description, item_date, location,
                    contact_name, contact_email, student_id, storage_location, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [row + (datetime.now(timezone.utc).isoformat(),) for row in seed_items],
            )


def row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    return dict(row)