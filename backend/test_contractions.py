import os
import sys
from dotenv import load_dotenv

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

from app.repository import OpenRouterRepository
from app.config import settings

def test_contractions():
    print("--- Probando corrección con contracciones ---")
    
    api_key = os.getenv("OPENROUTER_API_KEY") or settings.openrouter_api_key
    if not api_key:
        print("ERROR: La variable de entorno OPENROUTER_API_KEY no está configurada.")
        return
        
    print(f"Modelo: {settings.openrouter_model}")
    repo = OpenRouterRepository()
    
    sentences = [
        "If I'd known you were coming, I would've baked a cake.",
        "You'd better do your homework before going out.",
        "I'd get a new car if I had enough money.",
        "They wouldn't listen to my advice, which is frustrating."
    ]
    
    for sentence in sentences:
        print(f"\n==========================================")
        print(f"Original: \"{sentence}\"")
        try:
            result = repo.correct_text(sentence)
            print(f"Corregido: \"{result.corrected_text}\"")
            print(f"¿Tiene correcciones?: {result.has_corrections}")
            if result.has_corrections:
                print("Detalles:")
                for idx, corr in enumerate(result.corrections, 1):
                    print(f"  {idx}. [{corr.category.upper()}] \"{corr.original}\" -> \"{corr.corrected}\"")
                    print(f"     Explicación: {corr.explanation}")
            print(f"Feedback General: {result.general_feedback}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    test_contractions()
