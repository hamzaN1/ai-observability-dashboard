from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ChatRequest(BaseModel):
    prompt: str
    user_id: str = "anonymous"
    session_id: Optional[str] = None
    model: Optional[str] = None

class ChatResponse(BaseModel):
    trace_id: str
    response: str
    model: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    latency_ms: float
    status: str

class FeedbackRequest(BaseModel):
    trace_id: str
    helpful: bool

class AnalyticsResponse(BaseModel):
    total_requests: int
    successful_requests: int
    failed_requests: int
    total_tokens: int
    avg_latency_ms: float
    error_rate: float
    satisfaction_score: float