import json
import re
from app.services.llm import call_llm

EVAL_PROMPT_TEMPLATE = """
You are an AI response evaluator. Score the following assistant response strictly as JSON.

User Prompt: {prompt}
Assistant Response: {response}

Score each dimension from 0.0 to 1.0:
- relevance: Does the response directly address the prompt?
- faithfulness: Is the response factually grounded and accurate?
- completeness: Does the response fully answer the question?

Respond ONLY with this JSON and nothing else:
{{"relevance": 0.0, "faithfulness": 0.0, "completeness": 0.0}}
"""

async def evaluate_response(prompt: str, response: str) -> dict:
    eval_prompt = EVAL_PROMPT_TEMPLATE.format(
        prompt=prompt,
        response=response
    )

    result = await call_llm(eval_prompt)
    raw = result.get("response", "")

    try:
        # Strip markdown fences if model wraps in ```json
        clean = re.sub(r"```json|```", "", raw).strip()
        scores = json.loads(clean)

        relevance = float(scores.get("relevance", 0.0))
        faithfulness = float(scores.get("faithfulness", 0.0))
        completeness = float(scores.get("completeness", 0.0))
        overall = round((relevance + faithfulness + completeness) / 3, 3)
        hallucination_flag = overall < 0.5

        return {
            "relevance": relevance,
            "faithfulness": faithfulness,
            "completeness": completeness,
            "overall_score": overall,
            "hallucination_flag": hallucination_flag,
        }

    except Exception:
        # If the model doesn't return clean JSON, return safe defaults
        return {
            "relevance": 0.0,
            "faithfulness": 0.0,
            "completeness": 0.0,
            "overall_score": 0.0,
            "hallucination_flag": True,
        }