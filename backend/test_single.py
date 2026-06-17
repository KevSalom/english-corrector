import os
import sys
import time
from dotenv import load_dotenv

# Add app directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
load_dotenv()

from openai import OpenAI
from app.schemas import CorrectionResponse
from app.prompts import SYSTEM_CORRECTOR_PROMPT

SCHEMA_TEMPLATE = """
Deberás responder estrictamente con un objeto JSON que siga esta estructura:
{
  "original_text": "texto original en inglés",
  "corrected_text": "texto corregido en inglés",
  "has_corrections": true o false,
  "corrections": [
    {
      "original": "palabra o frase errónea",
      "corrected": "palabra o frase corregida",
      "explanation": "explicación de la regla en español",
      "category": "grammar" o "spelling" o "punctuation" o "style"
    }
  ],
  "general_feedback": "consejo general en español"
}
"""

def test_single():
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        print("ERROR: Key missing")
        return
        
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key
    )
    
    model = "deepseek/deepseek-v4-flash"
    sentence = "I am agree with your opinion, but my brother don't think so."
    
    print(f"Testing JSON Mode with prompt template on: {model}")
    start = time.time()
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_CORRECTOR_PROMPT + "\n" + SCHEMA_TEMPLATE},
                {"role": "user", "content": sentence}
            ],
            response_format={"type": "json_object"},
            max_tokens=1000,
            timeout=15.0
        )
        latency = time.time() - start
        print(f"SUCCESS: Took {latency:.2f}s")
        print("Response:", response.choices[0].message.content)
    except Exception as e:
        latency = time.time() - start
        print(f"FAILED: Took {latency:.2f}s")
        print("Error details:", type(e).__name__, str(e))

if __name__ == "__main__":
    test_single()
