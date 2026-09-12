# Sehat Sahulat — Working Scaffold

A runnable version of the 4-agent pipeline from the project doc: extraction →
RAG-grounded interpretation → urgency → scheduling, plus a simple browser frontend
to test it end-to-end.

## What's here

```
sehat-sahulat/
  backend/
    main.py              FastAPI app, one endpoint: POST /api/process
    models.py             The JSON contract between agents (read this first)
    groq_client.py        Groq API wrapper (text + vision)
    agents/
      extraction.py        Agent 1 — image -> structured lab values
      interpretation.py     Agent 2 — RAG-grounded explanation (EN + UR)
      urgency.py           Agent 3 — Routine / Needs Attention / Urgent
      scheduling.py        Agent 4 — rule-based slot pick + LLM-phrased reason
    rag/
      knowledge_base.py     ChromaDB + local embeddings, builds itself on first run
      kb_articles/          8 short original articles (swap/add more anytime)
    data/
      doctor_slots.json     Mock appointment data
  frontend/
    index.html             Upload -> animated agent progress -> results, no build step
```

## 1. Get a Groq API key

Free at https://console.groq.com — sign up, create an API key.

## 2. Backend setup

```bash
cd sehat-sahulat
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r backend/requirements.txt

cp backend/.env.example backend/.env
# then edit backend/.env and paste your real GROQ_API_KEY
```

Run it (from the `sehat-sahulat` folder, not inside `backend/`, so the `backend.`
imports resolve):

```bash
uvicorn backend.main:app --reload --port 8000
```

First request will be slower — it's building the Chroma knowledge base and downloading
the small local embedding model. After that it's cached in `backend/rag/chroma_store/`.

Check it's alive: open http://localhost:8000/api/health — should return `{"status":"ok"}`.

## 3. Frontend

No build step — just open the file:

```bash
open frontend/index.html        # macOS
# or just double-click it, or `python3 -m http.server` inside frontend/ and visit localhost
```

Upload a lab report photo (or a clear screenshot of one), click **Analyze report**.

## Known things to check before you rely on this for the demo

- **Model names drift.** `GROQ_TEXT_MODEL` and `GROQ_VISION_MODEL` in `.env` are current
  as of when this was written — check https://console.groq.com/docs/models if you get a
  404/model-not-found error, and update `.env` accordingly.
- **The 4 "steps" in the UI are currently a timed animation**, not real streaming — the
  backend does all 4 agents server-side and returns one JSON blob. It *looks* like live
  agent progress, but it isn't wired to real per-agent completion yet. That's a fine v1
  for a demo; if you want it to be real, the next step is Server-Sent Events (SSE) from
  `/api/process`, emitting one event per agent as it finishes. Happy to build that next.
- **Extraction quality depends entirely on photo clarity.** Test with a few different
  real report formats early — this is exactly what the original doc flagged as a risk
  for Member 2's track.
- **Scheduling is intentionally rule-based**, not LLM-decided, so it can't pick a wrong
  slot live on stage. Only the one-sentence "reason" text comes from the LLM. See the
  comment at the top of `agents/scheduling.py` if you want to change this.
- **Knowledge base is 8 articles**, not the 15–20 in the plan. They're original
  paraphrased summaries (safe to use/extend), covering the most common test types:
  CBC/hemoglobin, glucose, lipids, liver, kidney, thyroid, vitamins, electrolytes.
  Add more `.txt` files to `backend/rag/kb_articles/` and delete
  `backend/rag/chroma_store/` to force a re-ingest.
- **CORS is wide open (`allow_origins=["*"]`)** for local testing convenience — fine for
  a hackathon, not for anything public-facing.

## Next things worth talking through together

- Real SSE streaming for the progress view (mentioned above)
- Deploying backend (Render.com, per the original plan) + frontend (Vercel)
- Swapping the mock `doctor_slots.json` for the real dataset Member 6/4 build
- PDF upload support (currently image only)
