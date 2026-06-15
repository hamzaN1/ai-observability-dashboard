import uuid, random
from datetime import datetime, timedelta, timezone
from app.database import SessionLocal
from app.models.tables import Trace, Feedback

PROMPTS = [
    "How do I reset my password?",
    "What is the refund policy?",
    "Explain transformer architecture.",
    "Summarize the latest sales report.",
    "How do I integrate the API?",
]
RESPONSES = [
    "To reset your password, go to Settings > Security.",
    "Refunds are processed within 5-7 business days.",
    "Transformers use self-attention to process sequences in parallel.",
    "The sales report shows a 12% increase in Q3 revenue.",
    "To integrate the API, first generate an API key from your dashboard.",
]

db = SessionLocal()
now = datetime.now(timezone.utc)

for i in range(100):
    status = random.choices(["success", "failure"], weights=[90, 10])[0]
    idx = random.randint(0, len(PROMPTS) - 1)
    trace = Trace(
        session_id=str(uuid.uuid4()),
        user_id=f"user_{random.randint(1, 20)}",
        model=random.choice(["llama3.2", "mistral"]),
        prompt=PROMPTS[idx],
        response=RESPONSES[idx] if status == "success" else None,
        prompt_tokens=random.randint(10, 80),
        completion_tokens=random.randint(20, 150) if status == "success" else 0,
        total_tokens=random.randint(30, 230),
        latency_ms=round(random.uniform(200, 3000), 2),
        status=status,
        error_category=random.choice(["timeout", "rate_limit"]) if status == "failure" else None,
        created_at=now - timedelta(hours=random.randint(0, 168)),
    )
    db.add(trace)
    db.flush()

    if status == "success" and random.random() > 0.4:
        db.add(Feedback(trace_id=trace.id, helpful=random.random() > 0.25))

db.commit()
db.close()
print("Seeded 100 traces with feedback.")