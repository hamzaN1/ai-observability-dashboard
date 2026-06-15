# AI Observability Dashboard

A production-style LLM monitoring and observability platform — a lightweight alternative to LangSmith, Helicone, and Arize Phoenix. Built to demonstrate real-world AI engineering skills including prompt tracking, token monitoring, error analysis, RAG observability, model comparison, and live request streaming.

![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green?logo=fastapi)
![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)

---

## What This Project Does

When organizations deploy AI applications, they lose visibility into what's happening inside them — high latency, prompt failures, hallucinations, and rising token costs go undetected. This dashboard solves that.

Every LLM interaction is captured, stored, analyzed, and surfaced in a real-time dashboard. Engineers can inspect individual traces, track token costs, monitor error trends, evaluate response quality, compare models side by side, and watch live requests stream in as they happen.

---

## Features

| Feature | Description |
|---|---|
| **Prompt Tracking** | Every request stored with prompt, response, latency, tokens, user, session |
| **Token Monitoring** | Daily/weekly token usage, cost estimation, most expensive prompts |
| **Latency Analytics** | Avg, P95, P99 response times with trend charts |
| **Error Tracking** | Typed error categories (timeout, rate limit, model unavailable) with trend charts |
| **User Feedback** | Thumbs up/down per response, satisfaction score tracking |
| **Session Inspector** | Full conversation threads with feedback and errors per turn |
| **RAG Observability** | Retrieved chunks, similarity scores, retrieval time, source documents |
| **AI Eval Engine** | LLM-as-judge scoring for relevance, faithfulness, completeness |
| **Hallucination Flags** | Warning indicators when eval scores fall below threshold |
| **Cost Analysis** | Cost per user, session, day, and model |
| **Model Comparison** | Run the same prompt against two models, compare latency, quality, cost |
| **Prompt Replay** | Re-run any past prompt against the current model, view side-by-side diff |
| **Live Request Feed** | WebSocket stream showing requests in real time as they come in |

---

## Tech Stack

**Backend**
- Python 3.11+
- FastAPI
- SQLAlchemy ORM
- Alembic (database migrations)
- PostgreSQL 15

**Frontend**
- React 18 + Vite
- Tailwind CSS
- Recharts

**AI / Local Models**
- Ollama (runs models locally — no API costs)
- ChromaDB (vector database for RAG)

**Infrastructure**
- Docker + Docker Compose
- WebSockets (real-time log streaming)

---

## Prerequisites

Install these before running the project:

- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Ollama](https://ollama.com/) — for running local models

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/hamzaN1/ai-observability-dashboard.git
cd ai-observability
```

### 2. Pull models with Ollama

You need to download any model you want to use. Ollama runs them locally — no API keys or costs.

```cmd
ollama pull llama3.2
ollama pull mistral
ollama pull phi3
```

> You only need to do this once. Add any model from [ollama.com/library](https://ollama.com/library).

### 3. Start infrastructure (PostgreSQL + ChromaDB)

```cmd
docker run --name observability-db -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=admin123 -e POSTGRES_DB=ai_observability -p 5432:5432 -d postgres:15

docker run -d --name observability-chroma -p 8001:8000 chromadb/chroma:1.5.9
```

### 4. Set up the backend

```cmd
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:

```env
DATABASE_URL=postgresql://admin:admin123@localhost:5432/ai_observability
OLLAMA_BASE_URL=http://localhost:11434
DEFAULT_MODEL=llama3.2
CHROMA_HOST=localhost
CHROMA_PORT=8001
```

Run database migrations:

```cmd
alembic upgrade head
```

Seed sample data (optional but recommended for demo):

```cmd
python seed.py
```

Start the backend:

```cmd
uvicorn app.main:app --reload
```

API is now live at `http://localhost:8000`
Swagger docs at `http://localhost:8000/docs`

### 5. Set up the frontend

```cmd
cd ../frontend
npm install
npm run dev
```

Dashboard is now live at `http://localhost:5173`

---

## Daily Startup (after first setup)

Every time you come back to the project, run these in order:

**1. Start Ollama** (if not already running — it usually starts automatically)
```cmd
ollama serve
```

**2. Start Docker containers**
```cmd
docker start observability-db
docker start observability-chroma
```

**3. Start the backend**
```cmd
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload
```

**4. Start the frontend**
```cmd
cd frontend
npm run dev
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/chat` | Send a prompt to the LLM, log the trace |
| `POST` | `/feedback` | Submit thumbs up/down for a trace |
| `GET` | `/analytics` | Aggregate metrics (requests, tokens, latency, satisfaction) |
| `GET` | `/traces` | All prompt/response traces |
| `GET` | `/errors` | Error logs by category |
| `POST` | `/compare` | Run a prompt against two models side by side |
| `POST` | `/rag/ingest` | Add documents to the vector store |
| `POST` | `/rag/chat` | RAG-augmented chat with retrieval logging |
| `GET` | `/rag/retrievals` | View retrieval logs with similarity scores |
| `WS` | `/ws/logs` | WebSocket stream of live request events |

---

## Project Structure

```
ai-observability/
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI app, middleware, router registration
│   │   ├── database.py           # SQLAlchemy engine and session
│   │   ├── models/
│   │   │   └── tables.py         # ORM models: Trace, Feedback, RetrievalLog
│   │   ├── schemas/
│   │   │   └── chat.py           # Pydantic request/response schemas
│   │   ├── routers/
│   │   │   ├── chat.py           # POST /chat, POST /feedback
│   │   │   ├── analytics.py      # GET /analytics, GET /traces, POST /compare
│   │   │   ├── rag.py            # POST /rag/ingest, POST /rag/chat, GET /rag/retrievals
│   │   │   └── ws.py             # WebSocket /ws/logs
│   │   └── services/
│   │       ├── llm.py            # Ollama API client
│   │       ├── rag.py            # ChromaDB client, retrieve, ingest
│   │       └── broadcast.py      # WebSocket connection manager
│   ├── alembic/                  # Database migration files
│   ├── alembic.ini
│   ├── seed.py                   # Sample data generator
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx     # Analytics cards and charts
│   │   │   ├── Traces.jsx        # Searchable prompt/response table
│   │   │   ├── Errors.jsx        # Error trends and categories
│   │   │   ├── Sessions.jsx      # Conversation thread inspector
│   │   │   ├── Compare.jsx       # Model comparison UI
│   │   │   └── Cost.jsx          # Cost analysis page
│   │   └── components/
│   │       └── LiveLog.jsx       # Real-time WebSocket feed
│   └── package.json
└── docker-compose.yml            # Full stack containerization
```

---

## Model Comparison

The `/compare` endpoint runs the same prompt against two models in parallel and returns latency, token usage, and response quality side by side.

```json
POST /compare
{
  "prompt": "Explain neural networks",
  "model_a": "llama3.2",
  "model_b": "mistral"
}
```

> Both models must be pulled via `ollama pull <model>` before use.

---

## RAG Pipeline

Ingest your own documents, then query them with full retrieval observability:

```cmd
curl -X POST http://localhost:8000/rag/ingest -H "Content-Type: application/json" -d "{\"documents\": [{\"id\": \"doc1\", \"text\": \"Refunds are processed within 5-7 business days.\", \"metadata\": {\"source\": \"policy.pdf\"}}]}"
```

```cmd
curl -X POST http://localhost:8000/rag/chat -H "Content-Type: application/json" -d "{\"prompt\": \"How do I get a refund?\", \"user_id\": \"user_1\"}"
```

Every retrieval is logged with chunk ID, similarity score, source document, and retrieval time.

---

## Inspired By

- [LangSmith](https://smith.langchain.com/) — LLM tracing and evaluation
- [Helicone](https://www.helicone.ai/) — LLM observability proxy
- [Arize Phoenix](https://phoenix.arize.com/) — AI evaluation and tracing
- [SigNoz](https://signoz.io/) — OpenTelemetry-based monitoring

---

## 👤 Author



**Hamza Naveed Siddiqui**

Iqra University — BS Computer Science

[LinkedIn](https://linkedin.com/in/hamzanaveedsiddiqui) | [GitHub](https://github.com/hamzaN1) 

---

## License

MIT
