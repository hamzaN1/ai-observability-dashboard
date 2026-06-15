import uuid, time
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.services.rag import retrieve, add_documents
from app.services.llm import call_llm
from app.models.tables import Trace, RetrievalLog
from app.services.broadcast import manager

router = APIRouter()

class RAGRequest(BaseModel):
    prompt: str
    user_id: str = "anonymous"
    session_id: str = None
    model: str = None

class IngestRequest(BaseModel):
    documents: list[dict]  # [{id, text, metadata}]

@router.post("/rag/ingest")
def ingest(request: IngestRequest):
    add_documents(request.documents)
    return {"message": f"Ingested {len(request.documents)} documents"}

@router.post("/rag/chat")
async def rag_chat(request: RAGRequest, db: Session = Depends(get_db)):
    session_id = request.session_id or str(uuid.uuid4())

    # Retrieve relevant chunks
    retrieval_start = time.time()
    chunks = retrieve(request.prompt)
    retrieval_time_ms = round((time.time() - retrieval_start) * 1000, 2)

    # Build augmented prompt
    context = "\n\n".join([f"Source [{c['chunk_id']}]: {c['text']}" for c in chunks])
    augmented_prompt = f"""Use the following context to answer the question.

Context:
{context}

Question: {request.prompt}

Answer:"""

    # Call LLM
    result = await call_llm(augmented_prompt, request.model)

    # Save trace
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
    db.flush()

    # Save retrieval logs
    for chunk in chunks:
        db.add(RetrievalLog(
            trace_id=trace.id,
            chunk_id=chunk["chunk_id"],
            source_text=chunk["text"],
            similarity_score=chunk["score"],
            retrieval_time_ms=retrieval_time_ms,
        ))

    db.commit()
    db.refresh(trace)

    await manager.broadcast({
        "trace_id": trace.id,
        "user_id": trace.user_id,
        "model": trace.model,
        "prompt": trace.prompt[:80],
        "status": trace.status,
        "latency_ms": trace.latency_ms,
        "total_tokens": trace.total_tokens,
        "created_at": trace.created_at.isoformat(),
        "rag": True,
    })

    return {
        "trace_id": trace.id,
        "response": result["response"],
        "retrieved_chunks": chunks,
        "retrieval_time_ms": retrieval_time_ms,
        "model": result["model"],
        "latency_ms": result["latency_ms"],
        "status": result["status"],
    }

@router.get("/rag/retrievals")
def get_retrievals(limit: int = 50, db: Session = Depends(get_db)):
    logs = db.query(RetrievalLog).order_by(RetrievalLog.created_at.desc()).limit(limit).all()
    return logs