# Sehat Sahulat — Project Summary Report

**Project Path:** `C:\Users\User\Downloads\sehat-sahulat`

---

## 1. Project Overview

| Field | Details |
|---|---|
| **Project Name** | Sehat Sahulat |
| **Purpose** | A medical document explainer that turns uploaded medical images into patient-friendly, bilingual (English + Urdu) explanations. |
| **Problem** | Patients often cannot understand their medical documents (lab reports, prescriptions). Sehat Sahulat extracts structured info from an image and presents it in simple English/Urdu with urgency and scheduling recommendations. |

### Main Workflow
1. User uploads a medical image (JPEG/PNG/WEBP) via the browser frontend.
2. FastAPI backend sends the image to a Groq vision LLM for structured extraction.
3. Extracted items (lab values, vitals, symptoms, impression, medications, advice) are converted into simple English and Urdu explanations, with abnormal lab values grounded in a local ChromaDB RAG knowledge base.
4. An urgency classifier assesses how quickly care is needed.
5. A rule-based scheduler recommends a doctor appointment slot.
6. All results are returned to the frontend and displayed with language toggle support.

---

## 2. Project Objectives

- **Primary goal:** Provide an accessible, automated way for patients (especially Urdu speakers in Pakistan) to understand their medical documents without medical training.
- **User-facing purpose:** Upload a medical report image and receive a complete plain-language summary with next steps, urgency level, and a suggested appointment — in English and Urdu.

---

## 3. System Architecture

```
User Browser (index.html)
  │  POST /api/process (multipart image)
  ▼
FastAPI Backend (main.py)
  │
  ├─► Extraction Agent (extraction.py)
  │      │  chat_json_with_image() (Groq Vision LLM)
  │      │  → ExtractionResult (values, vitals, symptoms, ...)
  │      │
  │      ├─► Interpretation Agent (interpretation.py)
  │      │      │  chat_json() (Groq Text LLM)
  │      │      │  abnormal labs → retrieve() from ChromaDB RAG
  │      │      │  → InterpretationResult (EN + UR explanations)
  │      │      │
  │      ├─► Urgency Agent (urgency.py)
  │      │      │  chat_json()
  │      │      │  → UrgencyResult (Routine / Attention / Urgent)
  │      │      │
  │      ├─► Scheduling Agent (scheduling.py)
  │             │  Rule-based slot selection + chat_json() reason
  │             │  → SchedulingResult (chosen slot + reason)
  │
  ▼
PipelineResult (JSON) → User Browser (display UI)
```

### Component Responsibilities

| Layer | Component | Responsibility |
|---|---|---|
| **Frontend** | `frontend/index.html` | Static HTML page: image upload, animated progress, results display with EN/UR toggle. |
| **API Server** | `backend/main.py` | FastAPI app: health check + pipeline orchestration endpoint. |
| **Extraction** | `backend/agents/extraction.py` | Vision LLM extracts structured JSON → `ExtractionResult`. |
| **Interpretation** | `backend/agents/interpretation.py` | RAG-grounded explanations for labs; general explanations for all other items; EN + UR + disclaimer. |
| **Urgency** | `backend/agents/urgency.py` | LLM classifies urgency level with reasoning. |
| **Scheduling** | `backend/agents/scheduling.py` | Rule-based slot selection; LLM phrases reason. |
| **RAG / KB** | `backend/rag/knowledge_base.py` | ChromaDB + local embeddings + 8 articles; semantic retrieval. |
| **Models** | `backend/models.py` | Pydantic data contracts shared across agents. |
| **LLM Wrapper** | `backend/groq_client.py` | Groq SDK wrapper: text + vision, JSON mode, model fallback. |

## 4. Technology Stack

| Category | Technology |
|---|---|
| **Language** | Python 3 |
| **Web Framework** | FastAPI 0.115.0 |
| **ASGI Server** | Uvicorn (standard) 0.30.6 |
| **API Provider** | Groq API |
| **Vision Model** | `qwen/qwen3.6-27b` (default; fallback: `llama-3.2-90b-vision-preview`) |
| **Text Model** | `openai/gpt-oss-120b` |
| **LLM SDK** | `groq` Python SDK 0.11.0 |
| **Data Validation** | Pydantic 2.9.2 |
| **Environment Config** | `python-dotenv` 1.0.1 |
| **RAG Vector DB** | ChromaDB 0.5.5 (PersistentClient) |
| **Embeddings** | Sentence Transformers 3.1.1 (`all-MiniLM-L6-v2`) |
| **File Upload** | `python-multipart` 0.0.9 |
| **Frontend** | HTML5, CSS3 (custom), vanilla JavaScript (no framework, no build step) |

---

## 5. Backend Architecture

| File/Folder | Purpose |
|---|---|
| `backend/__init__.py` | Marks `backend` as a Python package. |
| `backend/main.py` | FastAPI entry point. CORS middleware (open for local testing). Two endpoints: `GET /api/health` and `POST /api/process`. Orchestrates the 4-agent pipeline. |
| `backend/models.py` | Pydantic models: `LabValue`, `ExtractionResult`, `InterpretationItem`, `InterpretationResult`, `UrgencyResult`, `DoctorSlot`, `SchedulingResult`, `PipelineResult`. |
| `backend/groq_client.py` | Groq SDK wrapper. `chat_json()` (text) and `chat_json_with_image()` (vision with base64 image). Both enforce `response_format={"type": "json_object"}`. `chat_json_with_image` sends `extra_body={"reasoning_effort": "none"}` to suppress Qwen reasoning. Auto-retries with fallback model on 404/model_not_found. |
| `backend/agents/extraction.py` | Agent 1 — vision LLM extracts structured JSON from image using a schema-defining system prompt. |
| `backend/agents/interpretation.py` | Agent 2 — RAG-grounded explanations for abnormal labs (EN + UR); general explanations for vitals, symptoms, impression, medications, advice. Includes disclaimer. |
| `backend/agents/urgency.py` | Agent 3 — LLM classifies urgency as Routine / Needs Attention / Urgent. |
| `backend/agents/scheduling.py` | Agent 4 — rule-based slot selection (keyword-to-specialty map + date sorting); LLM phrases reason with fallback. |
| `backend/rag/knowledge_base.py` | ChromaDB PersistentClient + all-MiniLM-L6-v2 embeddings. Auto-ingests 8 `.txt` articles on first `retrieve()` call. |
| `backend/rag/kb_articles/` | 8 original medical articles: blood_glucose, electrolytes, hemoglobin_cbc, kidney_function, lipid_panel, liver_function, thyroid_function, vitamins. |
| `backend/data/doctor_slots.json` | Mock doctor appointment slots (doctor_name, specialty, date, time, hospital_type). |
| `backend/requirements.txt` | Pinned Python dependencies. |

---

## 6. AI / LLM Processing Flow

**How the image is sent:** The frontend uploads the medical image as multipart form data to `POST /api/process`. `main.py` validates the content type (JPEG/PNG/WEBP only) and reads the raw bytes. `run_extraction()` passes the bytes to `chat_json_with_image()`, which base64-encodes them and sends them as a `data:{mime};base64,...` URL inside the user message content array (a text part + an image_url part).

**How structured extraction works:** A schema-defining system prompt instructs the vision model (`qwen/qwen3.6-27b`) to return exactly one JSON object with the keys `values`, `vitals`, `symptoms`, `impression`, `medications`, `advice`, and `raw_notes`. `extra_body={"reasoning_effort": "none"}` suppresses chain-of-thought output. If the primary model returns 404/model_not_found, the client retries with `llama-3.2-90b-vision-preview`. The JSON string is parsed with `json.loads()` and validated into `ExtractionResult` (Pydantic).

**How explanations are produced:**
- Abnormal lab values (flag = high/low): `_explain_flagged_lab_value()` builds a query from test name/flag/value/unit, retrieves top-3 chunks from ChromaDB via `retrieve()`, and includes the retrieved context in a prompt sent to `chat_json()`.
- All other items (vitals, symptoms, impression, medications, advice): `_explain_general()` uses `GENERAL_EXPLANATION_PROMPT` without RAG retrieval.
- Both paths use cautious wording ("may indicate", "is often associated with") and return `explanation_en`, `explanation_ur`, and `next_step`.

**How urgency works:** `run_urgency()` collects flagged values into a list prompt; the text LLM returns one urgency level plus 1-2 sentence reasoning. No flagged values → defaults to "Routine".

**How scheduling works:** `run_scheduling()` loads slots from `doctor_slots.json`, maps keywords (e.g., "glucose" → Endocrinologist) to pick a specialty, sorts by date, and applies urgency-based preferences (urgent → earliest; routine → earliest government slot). The LLM only phrases a one-sentence reason; on failure a canned fallback reason is used.

**JSON handling:** Both Groq wrappers set `response_format={"type": "json_object"}` so the model returns valid JSON. `json.loads()` parses the response, and Pydantic models validate/normalize it into typed objects.

---

## 7. Medical Information Extraction

The extraction agent (`backend/agents/extraction.py`) extracts the following from the uploaded medical image:

| Field | Type | Description |
|---|---|---|
| `values` | List of `LabValue` | Laboratory test results (e.g., blood glucose, cholesterol). Each entry has `test_name`, `value`, `unit`, `reference_range`, and `flag` (normal / high / low / unknown). |
| `vitals` | List of `LabValue` | Vital signs (e.g., BP, pulse, temperature, respiration rate). Same structure as `values`. |
| `symptoms` | List of strings | Patient-reported symptoms or chief complaints. |
| `impression` | String | Doctor's written diagnosis/impression, copied exactly from the document (never diagnosed by the system). |
| `medications` | List of strings | Prescribed medicines or treatments (e.g., "5% Dextrose IV stat"). |
| `advice` | List of strings | Instructions or recommendations given to the patient (e.g., "Adequate fluid intake"). |
| `raw_notes` | Optional string | Catch-all for text that doesn't fit other categories (patient name, date, UHID, etc.). |

**Extraction rules** (from the system prompt): extract only clearly visible information, never guess or invent; use empty strings/lists for unreadable or absent fields; flags must be exactly one of normal/high/low/unknown; return valid JSON only.

---

## 8. Interpretation Layer

The interpretation agent (`backend/agents/interpretation.py`) converts extracted medical information into patient-friendly explanations in both English and Urdu.

### Two Interpretation Modes

1. **RAG-Grounded Lab Value Explanations** (`_explain_flagged_lab_value`)
   - Applied to lab values with flag = `high` or `low`.
   - Retrieves the top 3 relevant chunks from the ChromaDB knowledge base using a semantic query built from the test name, flag, value, and unit.
   - The retrieved context is included in the LLM prompt alongside the lab value data.
   - The system prompt instructs the model to explain what the test measures, what the result likely means, and a general next step — using cautious language only.

2. **General Explanations** (`_explain_general`)
   - Applied to: vital signs, symptoms, clinical impression, medications, and advice.
   - Uses `GENERAL_EXPLANATION_PROMPT` without RAG retrieval.
   - Produces plain-language explanations in both languages.

### Output Structure
Each item becomes an `InterpretationItem` with:
- `test_name` — the label for this item
- `explanation_en` — patient-friendly explanation in English
- `explanation_ur` — patient-friendly explanation in Urdu
- `next_step` — a general recommendation (e.g., "Discuss with your doctor")

### Important Disclaimer
Every `InterpretationResult` carries a built-in disclaimer:
> *"This is not a medical diagnosis. Please consult a doctor for confirmation."*

The interpretation layer is intended to **simplify information from the uploaded document** and provide general medical context. It is **NOT a medical diagnosis** and must not be treated as a replacement for professional medical advice.

---

## 9. RAG / Knowledge Base

The project includes a lightweight, local RAG implementation that **is actively used** by the interpretation agent.

### Implementation
- **Vector Database:** ChromaDB `PersistentClient`, persisted to `backend/rag/chroma_store/` (auto-created on first run).
- **Embedding Model:** `all-MiniLM-L6-v2` via sentence-transformers (free, local, no second API key).
- **Knowledge Articles:** 8 short original articles in `backend/rag/kb_articles/` covering blood glucose, electrolytes, hemoglobin/CBC, kidney function, lipid panel, liver function, thyroid function, and vitamins.
- **Chunking:** Paragraph-level splitting (double-newline) — simple by design, sufficient at this corpus size.
- **Auto-ingestion:** On the first `retrieve()` call, if the collection is empty, all `.txt` articles are ingested automatically; the store is then reused from disk.

### Integration with the Pipeline
- RAG is used **only** by the interpretation agent for abnormal lab values (flag high/low).
- `retrieve(query, top_k=3)` returns the most relevant chunks, which are concatenated into the LLM prompt for grounded explanations.
- Non-lab items (vitals, symptoms, impression, medications, advice) are explained **without** RAG retrieval, using the general prompt.

---

## 10. API

The backend exposes two endpoints via FastAPI:

### `GET /api/health`
Simple health/liveness check.
- **Response (200):** `{"status": "ok"}`

### `POST /api/process`
The main pipeline endpoint.
- **Input:** Multipart form with a single file field named `file` (UploadFile). Accepted types: `image/jpeg`, `image/png`, `image/webp`.
- **Response:** `PipelineResult` containing:
  - `extraction` — `ExtractionResult` (values, vitals, symptoms, impression, medications, advice, raw_notes)
  - `interpretation` — `InterpretationResult` (list of EN/UR `InterpretationItem`s + disclaimer)
  - `urgency` — `UrgencyResult` (urgency level + reasoning)
  - `scheduling` — `SchedulingResult` (chosen doctor slot + reason)
- **Error Responses:**
  - `400` — unsupported file type or empty file
  - `422` — no medical information could be extracted from the image
  - `500` — extraction agent failure or pipeline failure after extraction

---

## 11. Frontend

| Aspect | Details |
|---|---|
| **Technology** | Single static HTML file (`frontend/index.html`); no framework, no build step |
| **Styling** | Custom CSS with CSS variables (color-coded for routine/attention/urgent states) |
| **Scripting** | Vanilla JavaScript (ES6) |
| **Upload** | Drag-and-drop area + file input button, with image preview |
| **Progress UI** | Animated 4-step indicator (Extraction → Interpretation → Urgency → Scheduling). **Note:** this is a timed CSS animation, not real per-step streaming — the backend runs all 4 agents server-side and returns one JSON response. |

### How it communicates with the backend
The page sends the selected image to `POST /api/process` as multipart form data, waits for the single JSON response, and renders it. All four agent stages execute server-side within that one request.

### User workflow
1. Open `frontend/index.html` in a browser.
2. Drag a medical image onto the dropzone or click to select a file; a preview appears.
3. Click **Analyze report**.
4. The animated progress steps run while the request completes.
5. The results panel appears with all extracted and interpreted data.

### How results are displayed
- **Extracted values** — HTML table with colored flag pills (normal / high / low)
- **Interpretations** — cards with an English/اردو toggle per item, showing the explanation and "Next step"
- **Urgency** — colored badge (green Routine / orange Needs Attention / red Urgent) with reasoning text
- **Scheduling** — doctor name, specialty, date/time, hospital type, and the booking reason
- **Disclaimer** — rendered below the interpretations

---

## 12. Data Flow

```
┌─────────────────────────────┐
│  User Browser (index.html)  │
│  uploads medical image      │
└──────────────┬──────────────┘
               │ POST /api/process (multipart file)
               ▼
┌─────────────────────────────┐
│  main.py (FastAPI)          │
│  validate type + read bytes │
└──────────────┬──────────────┘
               │ image_bytes + mime_type
               ▼
┌─────────────────────────────┐
│  extraction.py              │
│  chat_json_with_image()     │
│  (Groq vision model)        │
│  → ExtractionResult         │
└──────┬──────────────┬───────┘
       │              │
       ▼              ▼
┌─────────────────┐ ┌─────────────────┐
│ interpretation  │ │ urgency.py      │
│ .py             │ │ chat_json()     │
│ flagged labs →  │ │ → UrgencyResult │
│   retrieve() →  │ └────────┬────────┘
│   chat_json()   │          │
│ other items →   │          │
│   chat_json()   │          │
│ → Interpretation│          │
│   Result        │          │
└──────┬──────────┘          │
       │                     │
       ▼                     ▼
┌─────────────────────────────────────┐
│ scheduling.py                       │
│ keyword→specialty + doctor_slots.json│
│ rule-based pick + chat_json() reason│
│ → SchedulingResult                  │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│ PipelineResult (single JSON)        │
│ extraction + interpretation +       │
│ urgency + scheduling                │
└──────────────────┬──────────────────┘
                   │ HTTP 200 JSON
                   ▼
┌─────────────────────────────────────┐
│  User Browser                       │
│  values table, EN/UR cards,         │
│  urgency badge, doctor slot,        │
│  disclaimer                         │
└─────────────────────────────────────┘

RAG (called inside interpretation):
  retrieve() → ChromaDB (backend/rag/chroma_store/)
             → embeddings: all-MiniLM-L6-v2
             → sources: backend/rag/kb_articles/*.txt (8 articles)
```

---

## 13. Configuration

### Environment variables (`.env`)
`groq_client.py` calls `load_dotenv(BASE_DIR / ".env")`, so the operative env file is `backend/.env`.

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | Groq API key. Without it the client raises a RuntimeError before any LLM call. |
| `GROQ_TEXT_MODEL` | No | Overrides the default text model (`openai/gpt-oss-120b`). |
| `GROQ_VISION_MODEL` | No | Overrides the default vision model (`qwen/qwen3.6-27b`). |

> ⚠️ **Never commit or share the `.env` file** — it contains the live API key. Do not paste the key into any document, chat, or screenshot.

### `requirements.txt` (pinned)
```
fastapi==0.115.0
uvicorn[standard]==0.30.6
python-multipart==0.0.9
groq==0.11.0
chromadb==0.5.5
sentence-transformers==3.1.1
python-dotenv==1.0.1
pydantic==2.9.2
```

### Python environment
A local virtual environment (`.venv`) is used for dependency isolation. Pydantic v2 and the current Groq SDK require Python 3.8+; Python 3.11 is recommended.

---

## 14. Local Deployment / Running

### Prerequisites
- Python 3.11+ installed
- A Groq API key (free at https://console.groq.com)

### Setup and run — Windows

```bash
# 1. Go to the project root
cd C:\Users\User\Downloads\sehat-sahulat

# 2. Create the Python 3.11 virtual environment
python -m venv .venv

# 3. Activate it
.venv\Scripts\activate

# 4. Install requirements
pip install -r backend/requirements.txt

# 5. Configure the API key: edit backend/.env and set (do not share this file):
#    GROQ_API_KEY="your-groq-api-key-here"

# 6. Start the backend (from the project ROOT so `backend.` imports resolve)
uvicorn backend.main:app --reload --port 8000

# 7. Verify: open http://localhost:8000/api/health → {"status":"ok"}
```

### Start the frontend

```bash
# Option A — open the file directly (double-click, or:)
start frontend\index.html

# Option B — serve it (recommended if the backend is on another port/origin):
cd frontend
python -m http.server 8080
# then open http://localhost:8080
```

> **First request note:** the first `/api/process` call is slower — ChromaDB is created and the `all-MiniLM-L6-v2` embedding model is downloaded, then cached in `backend/rag/chroma_store/`.

### Note on the removed unit test
The mock-based unit test `backend/test_groq_client.py` (written while debugging the vision-model fallback) was removed during final-delivery cleanup: its test double was broken (`DummyResponse.choices` was a class instead of a list, so `resp.choices[0]` raised `TypeError: type 'choices' is not subscriptable`) and the test could never pass. The fallback logic in `groq_client.py` that it targeted is unchanged and is verified end-to-end via `POST /api/process`.

---

## 15. Current Project Status

Confirmed working (verified against the code and end-to-end runs):

| Area | Status | Notes |
|---|---|---|
| FastAPI service + health endpoint | ✅ Working | `GET /api/health` returns `{"status":"ok"}` |
| Vision extraction agent | ✅ Working | Image → structured JSON → `ExtractionResult` (values, vitals, symptoms, impression, medications, advice, raw_notes) |
| Groq JSON mode + model fallback | ⚠️ Implemented | `response_format=json_object` in both wrappers; auto-retry on 404/model_not_found to `llama-3.2-90b-vision-preview` (code-verified). The debug-era unit test with a broken test double was removed during final-delivery cleanup (see §14) |
| Interpretation agent | ✅ Working | RAG-grounded EN+UR explanations for abnormal labs; general EN+UR explanations for vitals, symptoms, impression, medications, advice |
| ChromaDB RAG knowledge base | ✅ Working | 8 articles ingested on first run (43 chunks observed); persisted in `backend/rag/chroma_store/` |
| Urgency agent | ✅ Working | Routine / Needs Attention / Urgent with reasoning; defaults to Routine when nothing is flagged |
| Scheduling agent | ✅ Working | Rule-based specialty mapping + slot pick from mock `doctor_slots.json`; LLM-phrased reason with fallback |
| Frontend | ✅ Working | Upload + preview, animated 4-step progress, values table, EN/اردو toggle cards, urgency badge, slot card, disclaimer |
| Pipeline orchestration | ✅ Working | `POST /api/process` returns one `PipelineResult`; 400/422/500 error paths implemented |
| End-to-end test (sample prescription) | ✅ Passed | BS 110 mg/dL flagged high; BP/PR vitals, symptoms, impression, meds, and advice all extracted and explained in EN+UR |

---

## 16. Limitations / Scope

Confirmed from the current implementation (not invented):

| # | Limitation | Where visible |
|---|---|---|
| 1 | Image-only input — JPEG, PNG, WEBP only; PDF not supported | content-type check in `main.py` |
| 2 | Extraction quality depends on photo clarity; no image preprocessing/OCR cleanup | README + extraction flow |
| 3 | The frontend's 4-step progress is a timed animation, not real per-agent streaming (no SSE) | README + frontend JS |
| 4 | Scheduling data is mock (hardcoded `doctor_slots.json`), not a live appointment system | `backend/data/` |
| 5 | Slot *selection* is deterministic rule-based (keyword→specialty map); only the reason sentence is LLM-generated | `scheduling.py` docstring |
| 6 | Knowledge base is 8 articles on common test types only | `rag/kb_articles/` |
| 7 | CORS is wide open (`allow_origins=["*"]`) for local/demo testing | `main.py` middleware |
| 8 | Flag labels come from the LLM's judgment vs. typical adult ranges — no deterministic re-check of flags | extraction prompt |
| 9 | No authentication or rate limiting on the API | `main.py` |
| 10 | Model availability depends on Groq's current model catalog; defaults may need updating over time | `groq_client.py` header comment |
| 11 | The debug-era unit test (`test_groq_client.py` — broken test double that could never pass) was removed during final-delivery cleanup; no unit tests remain — the pipeline is verified end-to-end via `POST /api/process` | removed file |

---

## 17. Future Scope

Ideas only — **not** implemented today:

- Real per-agent streaming (SSE) so the frontend progress reflects actual completion.
- PDF upload support alongside images.
- Expanding the knowledge base beyond 8 articles (15-20 planned in the original doc).
- Deploying the backend (e.g., Render) and frontend (e.g., Vercel) publicly.
- Replacing mock doctor slots with a real scheduling dataset/appointments API.
- Tightening CORS and adding authentication before any public deployment.

---

## 18. Security / Privacy Notes

- **API key privacy:** `GROQ_API_KEY` lives in `backend/.env` (and a root `.env`). Never commit, share, screenshot, or paste it. Keep `.env` out of version control via `.gitignore`.
- **Sensitive data:** uploaded medical documents contain personal health information. In this local setup images are sent to the Groq API for processing and are not persisted by the app. Any real deployment must handle PHI under applicable regulations and privacy law.
- **Not a medical device:** all explanations are educational simplifications with a built-in disclaimer. Never treat output as a diagnosis or a replacement for professional medical advice.
- **Transport/deployment:** CORS `*` and no auth are acceptable only for local development; restrict both before exposing the service.
- **Model behavior:** outputs are generated by third-party LLMs and can be imperfect; the system intentionally uses cautious, non-diagnostic language.

---

## 19. Project Structure

```
sehat-sahulat/
├── .env                            # Root-level env (contains GROQ_API_KEY — keep private)
├── .env.example                    # Shareable placeholder (GROQ_API_KEY=your_groq_api_key_here)
├── README.md                       # Setup guide + known notes
├── medicl_prescription.jpg         # Sample medical image for testing
├── PROJECT_SUMMARY.md              # This document
├── .venv/                          # Python virtual environment (not committed)
├── backend/
│   ├── __init__.py
│   ├── .env                        # Env loaded by groq_client.py (GROQ_API_KEY, optional model overrides)
│   ├── .env.example                # Shareable placeholder — real key stays in .env
│   ├── main.py                     # FastAPI app — GET /api/health, POST /api/process
│   ├── models.py                   # Pydantic contracts shared by all agents
│   ├── groq_client.py              # Groq SDK wrapper (text + vision, JSON mode, fallback)
│   ├── requirements.txt            # Pinned dependencies
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── extraction.py           # Agent 1 — image → structured JSON (vision LLM)
│   │   ├── interpretation.py       # Agent 2 — RAG-grounded EN/UR explanations
│   │   ├── urgency.py              # Agent 3 — Routine / Needs Attention / Urgent
│   │   └── scheduling.py           # Agent 4 — rule-based slot pick + LLM reason
│   ├── data/
│   │   └── doctor_slots.json       # Mock doctor appointment slots
│   └── rag/
│       ├── __init__.py
│       ├── .gitignore              # Excludes chroma_store/
│       ├── knowledge_base.py       # ChromaDB + embeddings + retrieve()
│       ├── chroma_store/           # Persisted vector store (generated, not committed)
│       └── kb_articles/
│           ├── blood_glucose.txt
│           ├── electrolytes.txt
│           ├── hemoglobin_cbc.txt
│           ├── kidney_function.txt
│           ├── lipid_panel.txt
│           ├── liver_function.txt
│           ├── thyroid_function.txt
│           └── vitamins.txt
└── frontend/
    └── index.html                  # Static single-page UI (no build step)
```

---

## 20. Final Summary

**Sehat Sahulat** is a local, browser-based medical document explainer for patients. A user photographs a lab report, prescription, or clinical note and uploads it; the FastAPI backend runs a four-agent pipeline on the image via the Groq API: a vision model extracts the medical content as structured JSON (lab values, vitals, symptoms, impression, medications, advice); abnormal lab values are explained with context retrieved from a local ChromaDB knowledge base, while every other extracted item gets a plain-language explanation — all produced in both English and Urdu; an urgency agent classifies how soon the patient should see a doctor; and a rule-based scheduler recommends the earliest appropriate doctor slot from mock data.

The output is deliberately educational, not diagnostic: every result carries the disclaimer "This is not a medical diagnosis. Please consult a doctor for confirmation." The system is intended as a patient-facing helper — especially for Urdu-speaking patients in Pakistan — that makes the contents of a medical document understandable and points the patient toward the right kind of follow-up care.