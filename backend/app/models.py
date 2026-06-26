from sqlmodel import SQLModel, Field
from datetime import datetime
import uuid

class SavedVideo(SQLModel, table=True):
    __tablename__ = "saved_videos"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    title: str
    url: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Note(SQLModel, table=True):
    __tablename__ = "notes"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
