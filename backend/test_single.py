import os
import sys
import time
import traceback
from dotenv import load_dotenv

# Add app directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
load_dotenv()

from openai import OpenAI
from app.schemas import CorrectionResponse
from app.prompts import SYSTEM_CORRECTOR_PROMPT

def test_single():
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        print("ERROR: Key missing")
        return
        
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key
    )
    
    schema = CorrectionResponse.model_json_schema()
    model = "inclusionai/ling-2.6-flash"
    sentence = "I am agree with your opinion, but my brother don't think so."
    
    print(f"Testing strict schema request to: {model}")
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_CORRECTOR_PROMPT},
                {"role": "user", "content": sentence}
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "CorrectionResponse",
                    "schema": schema,
                    "strict": True
                }
            },
            max_tokens=1000,
            timeout=15.0
        )
        print("SUCCESS")
    except Exception as e:
        print("FAILED")
        print("\n--- TRACEBACK ---")
        traceback.print_exc()

if __name__ == "__main__":
    test_single()
