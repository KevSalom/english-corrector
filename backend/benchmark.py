import os
import sys
import time
import json
from dotenv import load_dotenv

# Add app directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
load_dotenv()

from app.config import settings
from app.schemas import CorrectionResponse
from app.prompts import SYSTEM_CORRECTOR_PROMPT
import openai
from openai import OpenAI

# The 4 winning models from the previous benchmark
MODELS = [
    "google/gemini-2.5-flash-lite",
    "inclusionai/ling-2.6-flash",
    "xiaomi/mimo-v2-flash",
    "google/gemini-3.1-flash-lite"
]

# 10 Test sentences representing different error types and perfect sentences
TEST_SENTENCES = [
    "I am agree with your opinion, but my brother don't think so.",
    "I received a letter from my freind yesterday.",
    "Although it was raining we decided to go for a walk in the park",
    "She has been working as a software engineer for five years.",
    "I look forward to hear from you soon and discuss the details.",
    "Last year, I have visited three different countrys in Europe.",
    "If you need any further assistance, please do not hesitate to contact us.",
    "I want to make a question, did you did your homework?",
    "The team play really good when they are not tired.",
    "If she would have studied harder, she would pass the exam last week."
]

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

# Few-shot Example 1: Sentence with errors
FEW_SHOT_USER_1 = "I am agree with you, but she don't write very good."
FEW_SHOT_ASSISTANT_1 = {
  "original_text": "I am agree with you, but she don't write very good.",
  "corrected_text": "I agree with you, but she doesn't write very well.",
  "has_corrections": True,
  "corrections": [
    {
      "original": "am agree",
      "corrected": "agree",
      "explanation": "En inglés, 'agree' es un verbo y no requiere el verbo auxiliar 'am'. Decimos 'I agree' directamente.",
      "category": "grammar"
    },
    {
      "original": "don't",
      "corrected": "doesn't",
      "explanation": "Con la tercera persona del singular (she, he, it) en presente simple, el auxiliar negativo correcto es 'doesn't'.",
      "category": "grammar"
    },
    {
      "original": "good",
      "corrected": "well",
      "explanation": "Para describir cómo se realiza una acción (escribir), se utiliza el adverbio 'well' en lugar del adjetivo 'good'.",
      "category": "style"
    }
  ],
  "general_feedback": "¡Buen intento! Tu frase se entiende bien, pero recuerda conjugar correctamente el auxiliar para la tercera persona singular (she doesn't) y usar 'well' como adverbio para calificar acciones. Sigue practicando."
}

# Few-shot Example 2: Perfect sentence
FEW_SHOT_USER_2 = "She has been working as a software engineer for five years."
FEW_SHOT_ASSISTANT_2 = {
  "original_text": "She has been working as a software engineer for five years.",
  "corrected_text": "She has been working as a software engineer for five years.",
  "has_corrections": False,
  "corrections": [],
  "general_feedback": "¡Excelente! Tu oración es gramaticalmente correcta y suena muy natural. ¡Buen trabajo!"
}

def run_benchmark():
    print("====================================================", flush=True)
    print(" BENCHMARK MIXTO: SCHEMA ESTRICTO + FEW-SHOT + TEMP=0", flush=True)
    print("====================================================", flush=True)
    
    api_key = os.getenv("OPENROUTER_API_KEY") or settings.openrouter_api_key
    if not api_key:
        print("ERROR: La clave OPENROUTER_API_KEY no está configurada en el archivo .env.", flush=True)
        return

    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key
    )
    
    schema = CorrectionResponse.model_json_schema()
    results = {}

    for model in MODELS:
        print(f"\nProbando modelo mixto: {model} ...", flush=True)
        latencies = []
        success_count = 0
        correctly_null = 0 
        json_parse_errors = 0
        validation_errors = 0
        timeout_errors = 0
        
        for idx, sentence in enumerate(TEST_SENTENCES, 1):
            time.sleep(0.5)
            start_time = time.time()
            try:
                # Construct messages using few-shot history
                messages = [
                    {"role": "system", "content": SYSTEM_CORRECTOR_PROMPT + "\n" + SCHEMA_TEMPLATE},
                    {"role": "user", "content": FEW_SHOT_USER_1},
                    {"role": "assistant", "content": json.dumps(FEW_SHOT_ASSISTANT_1)},
                    {"role": "user", "content": FEW_SHOT_USER_2},
                    {"role": "assistant", "content": json.dumps(FEW_SHOT_ASSISTANT_2)},
                    {"role": "user", "content": sentence}
                ]
                
                # Using json_schema format WITH strict validation AND few-shot history
                response = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    response_format={
                        "type": "json_schema",
                        "json_schema": {
                            "name": "CorrectionResponse",
                            "schema": schema,
                            "strict": True
                        }
                    },
                    max_tokens=1000,
                    temperature=0.0,
                    timeout=15.0,  # 15 seconds timeout
                    extra_headers={
                        "HTTP-Referer": "https://github.com/kevin/english-corrector",
                        "X-Title": "Benchmark Mixto Schema Few Shot",
                    }
                )
                latency = time.time() - start_time
                latencies.append(latency)
                
                content = response.choices[0].message.content
                if not content:
                    raise ValueError("Content empty")
                
                cleaned = content.strip()
                if cleaned.startswith("```json"):
                    cleaned = cleaned[7:]
                elif cleaned.startswith("```"):
                    cleaned = cleaned[3:]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
                cleaned = cleaned.strip()

                data = json.loads(cleaned)
                
                # Pydantic validation
                response_obj = CorrectionResponse(**data)
                success_count += 1
                
                if idx in [4, 7]:
                    if not response_obj.has_corrections:
                        correctly_null += 1
                
            except openai.APITimeoutError:
                timeout_errors += 1
                print(f"  [Sentence {idx}] Timeout (took > 15s)", flush=True)
            except json.JSONDecodeError:
                json_parse_errors += 1
                print(f"  [Sentence {idx}] JSON Decode error", flush=True)
            except Exception as e:
                validation_errors += 1
                print(f"  [Sentence {idx}] Schema/Validation error: {str(e)[:50]}...", flush=True)
                
        avg_latency = sum(latencies) / len(latencies) if latencies else 0
        min_latency = min(latencies) if latencies else 0
        max_latency = max(latencies) if latencies else 0
        
        results[model] = {
            "avg_latency": avg_latency,
            "min_latency": min_latency,
            "max_latency": max_latency,
            "success_rate": f"{success_count}/{len(TEST_SENTENCES)}",
            "perfect_accuracy": f"{correctly_null}/2",
            "json_errors": json_parse_errors,
            "validation_errors": validation_errors,
            "timeout_errors": timeout_errors
        }
        
        print(f"  -> Resultados para {model}: Latencia Promedio: {avg_latency:.2f}s | Éxito: {success_count}/10 | Errores JSON/Schema: {json_parse_errors + validation_errors} | Timeouts: {timeout_errors}", flush=True)

    print("\n\n====================================================", flush=True)
    print("      INFORME DE BENCHMARK MIXTO (SCHEMA + FEW-SHOT)  ", flush=True)
    print("====================================================", flush=True)
    
    print("| Modelo | Latencia Promedio (s) | Rango Latencia (s) | Tasa de Éxito (JSON) | Precisión Sentencias Perfectas | Timeouts |", flush=True)
    print("| :--- | :---: | :---: | :---: | :---: | :---: |", flush=True)
    
    for model, stats in results.items():
        print(f"| {model} | {stats['avg_latency']:.2f}s | {stats['min_latency']:.2f}s - {stats['max_latency']:.2f}s | {stats['success_rate']} | {stats['perfect_accuracy']} | {stats['timeout_errors']} |", flush=True)

if __name__ == "__main__":
    run_benchmark()
