import logging
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.schemas import CorrectionRequest, CorrectionResponse
from app.repository import OpenRouterRepository

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="English Corrector API",
    description="API for correcting English sentences and providing explanations using LLMs via OpenRouter",
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
