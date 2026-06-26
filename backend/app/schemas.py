from pydantic import BaseModel, Field
from typing import List, Literal

class CorrectionItem(BaseModel):
    original: str = Field(description="The incorrect word or phrase from the user's sentence.")
    corrected: str = Field(description="The corrected word or phrase.")
    explanation: str = Field(description="A clear and simple explanation in Spanish detailing why the change was made and the grammar rule applied.")
    category: Literal["grammar", "spelling", "punctuation", "style"] = Field(
        description="The category of the mistake: 'grammar' for syntax errors, 'spelling' for typos, 'punctuation' for comma/period issues, 'style' for phrasing/naturalness."
    )

class CorrectionResponse(BaseModel):
    original_text: str = Field(description="The original English sentence sent by the user.")
    corrected_text: str = Field(description="The fully corrected and natural English sentence.")
    has_corrections: bool = Field(description="Boolean indicating whether any corrections or improvements were made.")
    corrections: List[CorrectionItem] = Field(
        default=[],
        description="A list of specific corrections made. Empty if has_corrections is false."
    )
    general_feedback: str = Field(
        description="A encouraging and helpful overview in Spanish of the user's grammar, mentioning what they did well and general areas of improvement."
    )

class CorrectionRequest(BaseModel):
    text: str = Field(..., max_length=1000, description="The English sentence or short paragraph to correct.")

class TranscriptRequest(BaseModel):
    url: str = Field(..., description="The YouTube video URL (standard, shorts, embed, or youtu.be).")

class TranscriptSegment(BaseModel):
    text: str = Field(..., description="The subtitle text snippet.")
    start: float = Field(..., description="Start time in seconds.")
    duration: float = Field(..., description="Duration in seconds.")

class TranscriptResponse(BaseModel):
    video_id: str = Field(..., description="The extracted 11-character YouTube video ID.")
    segments: List[TranscriptSegment] = Field(..., description="The list of timed transcript segments.")

class VideoSaveRequest(BaseModel):
    title: str = Field(..., description="The user-defined name for the video link.")
    url: str = Field(..., description="The YouTube video URL.")

class VideoResponse(BaseModel):
    id: str = Field(..., description="Unique ID of the saved video entry.")
    title: str = Field(..., description="The user-defined name for the video link.")
    url: str = Field(..., description="The YouTube video URL.")
    created_at: str = Field(..., description="The timestamp when the video was saved.")

class NoteCreateRequest(BaseModel):
    content: str = Field(..., max_length=2000, description="The text content of the note.")

class NoteResponse(BaseModel):
    id: str = Field(..., description="Unique ID of the note.")
    content: str = Field(..., description="The text content of the note.")
    created_at: str = Field(..., description="The timestamp when the note was created.")
