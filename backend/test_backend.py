import os
import sys
from dotenv import load_dotenv

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

from app.repository import OpenRouterRepository
from app.config import settings

def test_correction():
    print("--- Probando Conexión a OpenRouter ---")
    
    # Check API Key
    api_key = os.getenv("OPENROUTER_API_KEY") or settings.openrouter_api_key
    if not api_key:
        print("ERROR: La variable de entorno OPENROUTER_API_KEY no está configurada.")
        print("Crea un archivo '.env' en la carpeta 'backend/' y añade: OPENROUTER_API_KEY=tu_clave_aquí")
        return
        
    print(f"Modelo configurado: {settings.openrouter_model}")
    print("Iniciando repositorio...")
    
    try:
        repo = OpenRouterRepository()
        
        # Test sentence with spelling, grammar, and preposition issues
        test_sentence = "I am agree with you, but she don't write very good."
        print(f"\nTexto de prueba: \"{test_sentence}\"")
        print("Enviando petición a la IA...")
        
        result = repo.correct_text(test_sentence)
        
        print("\n--- Resultado Recibido ---")
        print(f"Texto Corregido: {result.corrected_text}")
        print(f"Tiene Correcciones: {result.has_corrections}")
        print("\nDetalle de Correcciones:")
        for idx, corr in enumerate(result.corrections, 1):
            print(f"  {idx}. [{corr.category.upper()}] \"{corr.original}\" -> \"{corr.corrected}\"")
            print(f"     Explicación: {corr.explanation}")
            
        print(f"\nFeedback General:\n{result.general_feedback}")
        print("\n¡Prueba completada con éxito!")
        
    except Exception as e:
        print(f"\nOcurrió un error durante la prueba: {e}")

if __name__ == "__main__":
    test_correction()
