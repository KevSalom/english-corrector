import logging
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.schemas import (
    CorrectionRequest,
    CorrectionResponse,
    TranscriptRequest,
    TranscriptResponse,
    TranscriptSegment
)
from app.repository import OpenRouterRepository
from youtube_transcript_api import YouTubeTranscriptApi
import re


# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Inglés al Grano API",
    description="API for Inglés al Grano (correcting English sentences and providing explanations using LLMs via OpenRouter)",
    version="1.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lazy instantiation of repository so it doesn't fail on startup if api key is missing
repo = None

def get_repository() -> OpenRouterRepository:
    global repo
    if repo is None:
        try:
            repo = OpenRouterRepository()
        except Exception as e:
            logger.error(f"Failed to initialize OpenRouter repository: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al inicializar el repositorio de corrección. Verifica la clave API."
            )
    return repo

@app.post("/api/correct", response_model=CorrectionResponse)
async def correct_sentence(request: CorrectionRequest):
    """
    Receives an English text, corrects grammar/spelling/style, and returns
    the corrected text with detailed explanations in Spanish.
    """
    if not request.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El texto a corregir no puede estar vacío."
        )
    
    try:
        repository = get_repository()
        result = repository.correct_text(request.text)
        return result
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to correct sentence: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en el servidor de IA: {str(e)}"
        )

def extract_youtube_video_id(url: str) -> str:
    url = url.strip()
    patterns = [
        r'(?:v=|\/embed\/|\/shorts\/|\/youtu\.be\/|\/v\/|\/e\/|watch\?v(?:%3D|=))([a-zA-Z0-9_-]{11})',
        r'youtu\.be\/([a-zA-Z0-9_-]{11})'
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
            
    if len(url) == 11 and re.match(r'^[a-zA-Z0-9_-]{11}$', url):
        return url
        
    return ""

@app.post("/api/video/transcript", response_model=TranscriptResponse)
async def get_youtube_transcript(request: TranscriptRequest):
    """
    Receives a YouTube URL, extracts the video ID, fetches the English transcript
    (or translates the available transcript to English), and returns the segments.
    """
    video_id = extract_youtube_video_id(request.url)
    if not video_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL de YouTube inválida. No se pudo extraer el ID del video."
        )
    
    try:
        api = YouTubeTranscriptApi()
        try:
            # Intentar obtener los subtítulos en inglés directamente (manuales o autogenerados)
            transcript_data = api.fetch(video_id, languages=['en'])
        except Exception:
            # Fallback: Listar transcripciones y buscar inglés, o traducir otra disponible al inglés
            try:
                transcript_list = api.list(video_id)
                try:
                    transcript_data = transcript_list.find_transcript(['en']).fetch()
                except Exception:
                    # Traducir el primer idioma disponible al inglés (traducción automática oficial)
                    first_transcript = next(iter(transcript_list))
                    transcript_data = first_transcript.translate('en').fetch()
            except Exception as inner_e:
                logger.error(f"Failed listing transcripts for {video_id}: {inner_e}")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No se encontraron subtítulos disponibles para este video en YouTube."
                )

                
        segments = []
        for entry in transcript_data:
            segments.append(TranscriptSegment(
                text=entry.text,
                start=entry.start,
                duration=entry.duration
            ))

            
        return TranscriptResponse(video_id=video_id, segments=segments)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching transcript for video {video_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener la transcripción: {str(e)}"
        )

@app.get("/api/health")
async def health_check():

    """
    Checks the service health and if the OpenRouter key is set.
    """
    is_key_set = bool(settings.openrouter_api_key)
    return {
        "status": "healthy",
        "model": settings.openrouter_model,
        "api_key_configured": is_key_set
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.host, port=settings.port, reload=True)
