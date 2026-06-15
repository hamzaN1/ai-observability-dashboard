# Cost per 1000 tokens (in USD) — local Ollama models are free,
# but we simulate cost for portfolio purposes
MODEL_COSTS = {
    "llama3.2":  {"input": 0.0002, "output": 0.0002},
    "mistral":   {"input": 0.0002, "output": 0.0006},
    "phi3":      {"input": 0.0001, "output": 0.0001},
    "default":   {"input": 0.0002, "output": 0.0002},
}

def calculate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    rates = MODEL_COSTS.get(model, MODEL_COSTS["default"])
    cost = (prompt_tokens / 1000 * rates["input"]) + \
           (completion_tokens / 1000 * rates["output"])
    return round(cost, 6)