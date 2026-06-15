from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from app.database import get_db
from app.models.tables import Trace, Feedback, EvaluationScore
from app.schemas.chat import AnalyticsResponse
from app.services.cost import calculate_cost, MODEL_COSTS
from app.services.llm import call_llm
from pydantic import BaseModel

router = APIRouter()


@router.get("/analytics", response_model=AnalyticsResponse)
def get_analytics(db: Session = Depends(get_db)):
    total = db.query(func.count(Trace.id)).scalar() or 0
    successful = db.query(func.count(Trace.id)).filter(Trace.status == "success").scalar() or 0
    failed = total - successful
    total_tokens = db.query(func.sum(Trace.total_tokens)).scalar() or 0
    avg_latency = db.query(func.avg(Trace.latency_ms)).scalar() or 0.0

    total_feedback = db.query(func.count(Feedback.id)).scalar() or 0
    helpful = db.query(func.count(Feedback.id)).filter(Feedback.helpful == True).scalar() or 0
    satisfaction = round((helpful / total_feedback * 100), 1) if total_feedback > 0 else 0.0

    return AnalyticsResponse(
        total_requests=total,
        successful_requests=successful,
        failed_requests=failed,
        total_tokens=total_tokens,
        avg_latency_ms=round(avg_latency, 2),
        error_rate=round((failed / total * 100), 1) if total > 0 else 0.0,
        satisfaction_score=satisfaction,
    )

@router.get("/feedback/trend")
def get_feedback_trend(db: Session = Depends(get_db)):
    rows = db.query(Feedback).order_by(Feedback.created_at.asc()).all()
    # Group by day
    map_ = {}
    for f in rows:
        day = f.created_at.strftime("%b %d")
        if day not in map_:
            map_[day] = {"day": day, "helpful": 0, "not_helpful": 0}
        if f.helpful:
            map_[day]["helpful"] += 1
        else:
            map_[day]["not_helpful"] += 1
    return list(map_.values())

@router.get("/health")
def health():
    return {"status": "ok"}

@router.get("/traces")
def get_traces(limit: int = 50, db: Session = Depends(get_db)):
    traces = db.query(Trace).order_by(Trace.created_at.desc()).limit(limit).all()
    return traces

@router.get("/traces/{trace_id}")
def get_trace(trace_id: str, db: Session = Depends(get_db)):
    trace = db.query(Trace).filter(Trace.id == trace_id).first()
    evaluation = db.query(EvaluationScore).filter(
        EvaluationScore.trace_id == trace_id
    ).first()
    feedback = db.query(Feedback).filter(
        Feedback.trace_id == trace_id
    ).first()

    return {
        "trace": trace,
        "evaluation": evaluation,
        "feedback": feedback,
    }

@router.get("/errors")
def get_errors(db: Session = Depends(get_db)):
    # Error counts by category
    rows = (
        db.query(Trace.error_category, func.count(Trace.id).label("count"))
        .filter(Trace.status == "failure")
        .group_by(Trace.error_category)
        .all()
    )
    by_category = [{"category": r.error_category or "unknown", "count": r.count} for r in rows]

    # Recent errors
    recent = (
        db.query(Trace)
        .filter(Trace.status == "failure")
        .order_by(Trace.created_at.desc())
        .limit(20)
        .all()
    )

    return {
        "by_category": by_category,
        "recent": [
            {
                "id": t.id,
                "prompt": t.prompt,
                "error_category": t.error_category,
                "error_message": t.error_message,
                "model": t.model,
                "latency_ms": t.latency_ms,
                "created_at": t.created_at,
            }
            for t in recent
        ],
        "total": sum(r["count"] for r in by_category),
    }

@router.get("/evaluations")
def get_evaluations(limit: int = 50, db: Session = Depends(get_db)):
    results = (
        db.query(EvaluationScore, Trace)
        .join(Trace, EvaluationScore.trace_id == Trace.id)
        .order_by(EvaluationScore.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "trace_id": e.trace_id,
            "prompt": t.prompt,
            "model": t.model,
            "relevance": e.relevance,
            "faithfulness": e.faithfulness,
            "completeness": e.completeness,
            "overall_score": e.overall_score,
            "hallucination_flag": e.hallucination_flag,
            "created_at": e.created_at,
        }
        for e, t in results
    ]

@router.get("/cost")
def get_cost_analysis(db: Session = Depends(get_db)):
    traces = db.query(Trace).filter(Trace.status == "success").all()

    total_cost = 0.0
    cost_by_model = {}
    cost_by_day = {}

    for trace in traces:
        cost = calculate_cost(trace.model, trace.prompt_tokens, trace.completion_tokens)
        total_cost += cost

        cost_by_model[trace.model] = round(
            cost_by_model.get(trace.model, 0.0) + cost, 6
        )

        day = trace.created_at.strftime("%Y-%m-%d")
        cost_by_day[day] = round(cost_by_day.get(day, 0.0) + cost, 6)

    return {
        "total_cost_usd": round(total_cost, 6),
        "cost_by_model": cost_by_model,
        "cost_by_day": cost_by_day,
    }

@router.post("/replay/{trace_id}")
async def replay_trace(trace_id: str, db: Session = Depends(get_db)):
    from app.services.llm import call_llm

    original = db.query(Trace).filter(Trace.id == trace_id).first()
    if not original:
        return {"error": "Trace not found"}

    new_result = await call_llm(original.prompt, original.model)

    return {
        "original_response": original.response,
        "replayed_response": new_result["response"],
        "original_latency_ms": original.latency_ms,
        "replayed_latency_ms": new_result["latency_ms"],
        "model": original.model,
        "prompt": original.prompt,
    }

class CompareRequest(BaseModel):
    prompt: str
    model_a: str = "llama3.2"
    model_b: str = "mistral"

@router.post("/compare")
async def compare_models(request: CompareRequest):
    import asyncio
    result_a, result_b = await asyncio.gather(
        call_llm(request.prompt, request.model_a),
        call_llm(request.prompt, request.model_b),
    )
    return {
        "prompt": request.prompt,
        "model_a": {
            "model": request.model_a,
            "response": result_a["response"],
            "latency_ms": result_a["latency_ms"],
            "total_tokens": result_a["total_tokens"],
            "status": result_a["status"],
        },
        "model_b": {
            "model": request.model_b,
            "response": result_b["response"],
            "latency_ms": result_b["latency_ms"],
            "total_tokens": result_b["total_tokens"],
            "status": result_b["status"],
        },
    }

@router.get("/health")
def health():
    return {"status": "ok"}