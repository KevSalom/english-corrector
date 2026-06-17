import json
import logging
from openai import OpenAI
from app.config import settings
from app.schemas import CorrectionResponse
from app.prompts import SYSTEM_CORRECTOR_PROMPT

logger = logging.getLogger(__name__)

class OpenRouterRepository:
    def __init__(self):
        # We use the standard OpenAI client but configured for OpenRouter
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.openrouter_api_key
        )
        self.model = settings.openrouter_model

    def correct_text(self, text: str) -> CorrectionResponse:
        if not settings.openrouter_api_key:
            raise ValueError("OPENROUTER_API_KEY is not configured in the environment variables (.env file).")

        try:
            # We construct the JSON Schema to pass to OpenRouter for structured output
            schema = CorrectionResponse.model_json_schema()
            
            logger.info(f"Sending request to OpenRouter using model: {self.model}")
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": SYSTEM_CORRECTOR_PROMPT},
                    {"role": "user", "content": text}
                ],
                # OpenRouter supports structured output JSON Schema
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "CorrectionResponse",
                        "schema": schema,
                        "strict": True
                    }
                },
                max_tokens=1000,  # Prevent response truncation
                extra_headers={
                    "HTTP-Referer": "https://github.com/kevin/english-corrector",
                    "X-Title": "English Corrector App",
                }
            )

            response_content = response.choices[0].message.content
            if not response_content:
                raise ValueError("Received empty response from OpenRouter.")
            
            # Clean up potential markdown wrappers
            cleaned_content = response_content.strip()
            if cleaned_content.startswith("```json"):
                cleaned_content = cleaned_content[7:]
            elif cleaned_content.startswith("```"):
                cleaned_content = cleaned_content[3:]
            if cleaned_content.endswith("```"):
                cleaned_content = cleaned_content[:-3]
            cleaned_content = cleaned_content.strip()
            
            # Parse the response to ensure it matches the schema
            data = json.loads(cleaned_content)
            
            # Pydantic validation
            validated_response = CorrectionResponse(**data)
            return validated_response

        except json.JSONDecodeError as e:
            logger.error(f"Failed to decode JSON from model response: {e}. Raw content: {response_content}")
            raise RuntimeError(f"El modelo no devolvió un JSON válido: {e}")
        except Exception as e:
            logger.error(f"Error calling OpenRouter: {e}")
            raise e
