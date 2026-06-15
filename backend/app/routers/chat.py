import uuid
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app.schemas.chat import ChatRequest, ChatResponse, FeedbackRequest
from app.models.tables import Trace, Feedback, EvaluationScore
from app.services.llm import call_llm
from app.services.evaluator import evaluate_response
from app.services.broadcast import manager

router = APIRouter()

async def run_evaluation(trace_id: str, prompt: str, response: str):
    scores = await evaluate_response(prompt, response)
    db = SessionLocal()
    try:
        evaluation = EvaluationScore(
            trace_id=trace_id,
            **scores
        )
        db.add(evaluation)
        db.commit()
    finally:
        db.close()

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    session_id = request.session_id or str(uuid.uuid4())
    result = await call_llm(request.prompt, request.model)

    trace = Trace(
        session_id=session_id,
        user_id=request.user_id,
        model=result["model"],
        prompt=request.prompt,
        response=result["response"],
        prompt_tokens=result["prompt_tokens"],
        completion_tokens=result["completion_tokens"],
        total_tokens=result["total_tokens"],
        latency_ms=result["latency_ms"],
        status=result["status"],
        error_category=result["error_category"],
        error_message=result["error_message"],
    )
    db.add(trace)
    db.commit()
    db.refresh(trace)

    await manager.broadcast({
        "trace_id": trace.id,
        "user_id": trace.user_id,
        "model": trace.model,
        "prompt": trace.prompt[:80] + "..." if len(trace.prompt) > 80 else trace.prompt,
        "status": trace.status,
        "latency_ms": trace.latency_ms,
        "total_tokens": trace.total_tokens,
        "created_at": trace.created_at.isoformat(),
    })

    # Fire evaluation in background — doesn't slow down the response
    if result["status"] == "success" and result["response"]:
        background_tasks.add_task(
            run_evaluation,
            trace.id,
            request.prompt,
            result["response"]
        )

    return ChatResponse(
        trace_id=trace.id,
        response=result["response"] or "",
        model=result["model"],
        prompt_tokens=result["prompt_tokens"],
        completion_tokens=result["completion_tokens"],
        total_tokens=result["total_tokens"],
        latency_ms=result["latency_ms"],
        status=result["status"],
    )

@router.post("/feedback")
def submit_feedback(request: FeedbackRequest, db: Session = Depends(get_db)):
    feedback = Feedback(trace_id=request.trace_id, helpful=request.helpful)
    db.add(feedback)
    db.commit()
    return {"message": "Feedback recorded"}