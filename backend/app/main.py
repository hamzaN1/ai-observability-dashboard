from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chat, analytics, ws, rag

app = FastAPI(title="AI Observability API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(analytics.router)
app.include_router(ws.router) 
app.include_router(rag.router)