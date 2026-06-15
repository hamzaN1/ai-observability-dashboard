import os
import time
import httpx
from dotenv import load_dotenv

load_dotenv()

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "llama3.2")

def count_tokens(text: str) -> int:
    # Simple approximation: 1 token ≈ 4 characters
    return max(1, len(text) // 4)

async def call_llm(prompt: str, model: str = None) -> dict:
    model = model or DEFAULT_MODEL
    start = time.time()

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={"model": model, "prompt": prompt, "stream": False}
            )
            resp.raise_for_status()
            data = resp.json()

        latency_ms = (time.time() - start) * 1000
        response_text = data.get("response", "")

        return {
            "response": response_text,
            "model": model,
            "prompt_tokens": count_tokens(prompt),
            "completion_tokens": count_tokens(response_text),
            "total_tokens": count_tokens(prompt) + count_tokens(response_text),
            "latency_ms": round(latency_ms, 2),
            "status": "success",
            "error_category": None,
            "error_message": None,
        }

    except httpx.TimeoutException:
        return {
            "response": None, "model": model,
            "prompt_tokens": count_tokens(prompt), "completion_tokens": 0,
            "total_tokens": count_tokens(prompt), "latency_ms": round((time.time() - start) * 1000, 2),
            "status": "failure", "error_category": "timeout", "error_message": "Request timed out"
        }
    except Exception as e:
        return {
            "response": None, "model": model,
            "prompt_tokens": count_tokens(prompt), "completion_tokens": 0,
            "total_tokens": count_tokens(prompt), "latency_ms": round((time.time() - start) * 1000, 2),
            "status": "failure", "error_category": "unknown", "error_message": str(e)
        }