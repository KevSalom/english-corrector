import os
from typing import List, Optional
from sqlmodel import SQLModel, create_engine, Session, select
from app.config import settings
from app.models import SavedVideo, Note

# Resolve relative paths relative to the backend root directory
db_path = settings.database_path
if not os.path.isabs(db_path):
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(backend_dir, db_path)

# Ensure parent directories exist
db_dir = os.path.dirname(db_path)
if db_dir:
    os.makedirs(db_dir, exist_ok=True)

# Create SQLModel database engine
# connect_args={"check_same_thread": False} is required for SQLite in multithreaded environments like FastAPI
sqlite_url = f"sqlite:///{db_path}"
engine = create_engine(sqlite_url, connect_args={"check_same_thread": False}, echo=False)

def init_db():
    """Initializes the database schema if tables do not exist."""
    SQLModel.metadata.create_all(engine)

# --- Videos CRUD ---

def list_videos() -> List[SavedVideo]:
    """Returns all saved videos sorted by creation date descending."""
    with Session(engine) as session:
        statement = select(SavedVideo).order_by(SavedVideo.created_at.desc())
        return list(session.exec(statement).all())

def add_video(title: str, url: str) -> SavedVideo:
    """Adds a new video and returns the created record."""
    video = SavedVideo(title=title.strip(), url=url.strip())
    with Session(engine) as session:
        session.add(video)
        session.commit()
        session.refresh(video)
        return video

def delete_video(video_id: str) -> bool:
    """Deletes a video by ID. Returns True if deleted, False if not found."""
    with Session(engine) as session:
        video = session.get(SavedVideo, video_id)
        if not video:
            return False
        session.delete(video)
        session.commit()
        return True

# --- Notes CRUD ---

def list_notes() -> List[Note]:
    """Returns all notes sorted by creation date descending."""
    with Session(engine) as session:
        statement = select(Note).order_by(Note.created_at.desc())
        return list(session.exec(statement).all())

def add_note(content: str) -> Note:
    """Adds a new note and returns the created record."""
    note = Note(content=content.strip())
    with Session(engine) as session:
        session.add(note)
        session.commit()
        session.refresh(note)
        return note

def delete_note(note_id: str) -> bool:
    """Deletes a note by ID. Returns True if deleted, False if not found."""
    with Session(engine) as session:
        note = session.get(Note, note_id)
        if not note:
            return False
        session.delete(note)
        session.commit()
        return True

def update_note(note_id: str, content: str) -> Optional[Note]:
    """Updates a note's content by ID. Returns the updated record or None if not found."""
    with Session(engine) as session:
        note = session.get(Note, note_id)
        if not note:
            return None
        note.content = content.strip()
        session.add(note)
        session.commit()
        session.refresh(note)
        return note
