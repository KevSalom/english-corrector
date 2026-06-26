import sqlite3
import os
import uuid
from typing import List, Dict, Any
from app.config import settings

def get_db_connection():
    db_path = settings.database_path
    
    # Resolve relative paths relative to the backend root directory
    if not os.path.isabs(db_path):
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        db_path = os.path.join(backend_dir, db_path)
        
    # Ensure parent directories exist (crucial for VPS volume mount paths)
    db_dir = os.path.dirname(db_path)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
        
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the database schema if tables do not exist."""
    conn = get_db_connection()
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS saved_videos (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                url TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
    finally:
        conn.close()

def list_videos() -> List[Dict[str, Any]]:
    """Returns all saved videos sorted by creation date descending."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, title, url, created_at FROM saved_videos ORDER BY created_at DESC")
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()

def add_video(title: str, url: str) -> Dict[str, Any]:
    """Adds a new video and returns the created record."""
    video_id = str(uuid.uuid4())
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO saved_videos (id, title, url) VALUES (?, ?, ?)",
            (video_id, title.strip(), url.strip())
        )
        conn.commit()
        
        cursor.execute("SELECT id, title, url, created_at FROM saved_videos WHERE id = ?", (video_id,))
        row = cursor.fetchone()
        return dict(row)
    finally:
        conn.close()

def delete_video(video_id: str) -> bool:
    """Deletes a video by ID. Returns True if deleted, False if not found."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM saved_videos WHERE id = ?", (video_id,))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()
