# ✨ Lumi AI — Advanced AI Conversation, Voice & Knowledge Platform

> A production-grade, full-stack AI assistant platform built with FastAPI, React 19, TypeScript, Groq Generative AI, Pure-Python BM25 Vector RAG, and Browser Speech Systems. Designed with an elegant Light Lavender, White, and Purple interface.

---

## 🌟 Executive Overview

**Lumi AI** is an advanced conversation, voice, and knowledge assistant engineered for high-performance generative AI workloads. Powered by the Groq LPU inference engine, Lumi delivers sub-second response streaming with context-aware RAG document grounding, safe CSV data analytics, and real-time voice conversations.

---

## 🎨 Design System

Lumi AI strictly implements a curated **Light Lavender, White, and Purple** palette:

| Element | Color Hex | Role |
| :--- | :--- | :--- |
| **Primary Page Background** | `#FAF9FF` | Clean, subtle ambient backdrop |
| **Main Content Surface** | `#FFFFFF` | Message cards, inputs, dropdowns |
| **Secondary Surface** | `#F5F1FF` | Hover states, active controls |
| **Lavender Surface** | `#EDE5FF` | Active mode pills, user badges |
| **Soft Purple** | `#D8C8F5` | Subtle borders, progress indicators |
| **Primary Purple** | `#7654B8` | Primary action buttons, active accents |
| **Hover Purple** | `#6543A0` | Interactive button hover states |
| **Deep Purple** | `#49356F` | Typography emphasis, dark mode contrast |
| **Primary Text** | `#292638` | High-contrast readable typography |
| **Secondary Text** | `#777386` | Metadata, timestamps, placeholders |
| **Borders** | `#E9E4F0` | Thin, modern architectural dividers |

---

## 🚀 Key Features

### 1. ⚡ Groq High-Speed Generative AI
- **Streaming Responses:** Real-time Server-Sent Events (SSE) streaming with sub-second token latency.
- **Multi-Model Support:** Seamless switching between configured models:
  - `llama-3.3-70b-versatile` (Default recommended)
  - `llama-3.1-8b-instant`
  - `mixtral-8x7b-32768`
  - `gemma2-9b-it`
- **Graceful Error Handling:** Translates provider timeouts, missing keys, and rate limits into clean, actionable in-app guidance without fake simulated responses.

### 2. 🧠 Retrieval-Augmented Generation (RAG)
- **Multi-Format Ingestion:** Ingests and parses `.pdf`, `.docx`, `.txt`, `.md`, `.csv`, and `.json`.
- **Pure-Python BM25 Retrieval Engine:** A self-contained, lightning-fast BM25 lexical vector engine operating in memory and database without requiring heavy C extensions or paid vector databases.
- **Source Citations:** Grounded answers provide interactive citation cards indicating file source, section, and similarity score.

### 3. 🎙️ Complete Voice Assistant System
- **Speech-to-Text (STT):** Browser-native Web Speech recognition with active microphone wave indicator.
- **Text-to-Speech (TTS):** Browser SpeechSynthesis with markdown syntax cleaning, voice picker, and rate control.
- **Dedicated Voice Mode:** Turn-based modal interface with animated waveforms, live transcript, and interruption support.
- **Server Audio Transcription:** Backend Groq `whisper-large-v3` API fallback integration.

### 4. 📊 Safe CSV Data Analysis Workspace
- **Dataset Profiling:** Column type inference, missing value counts, unique counts, and duplicate row detection.
- **Descriptive Statistics:** Calculates exact min, max, mean, standard deviation, and median.
- **Interactive Aggregation:** Safe server-side `groupby` operations with `mean`, `sum`, `count`, `min`, and `max`.
- **Sandboxed Security:** Zero arbitrary code execution; all operations run through safe mathematical routines.

### 5. 🎭 8 Dedicated Assistant Modes
- **General:** Everyday question answering and synthesis.
- **Coding:** Production-grade software architecture, debugging, and syntax-highlighted code.
- **Writing:** Professional editing, executive memos, and copywriting.
- **Learning:** Step-by-step Socratic explanations and analogies.
- **Research:** Evidence-based analysis with uncertainty recognition.
- **Data Analysis:** Statistical interpretation and pattern discovery.
- **Creative:** Brainstorming, ideation, and narrative generation.
- **Custom:** Full user-specified system instructions.

### 6. 💾 Three-Tier Conversation Memory
- **Active Thread Context:** Bounded sliding context window.
- **Persistent Database:** SQLite / PostgreSQL persistence across app reloads.
- **Cross-Conversation Memory:** User-defined preference entries (e.g. `Preferred Framework: React`) automatically injected into system prompts.

---

## 🏗️ Architecture & Technology Stack

```
                  ┌────────────────────────────────────────┐
                  │          React 19 + TypeScript         │
                  │   Tailwind CSS + Lucide + Markdown     │
                  └───────────────────┬────────────────────┘
                                      │ HTTP / SSE Stream
                                      ▼
                  ┌────────────────────────────────────────┐
                  │         FastAPI (Python 3.11+)         │
                  │   Uvicorn • Pydantic v2 • SQLAlchemy   │
                  └──────┬────────────┬────────────┬───────┘
                         │            │            │
            ┌────────────┴──┐  ┌──────┴─────┐  ┌───┴───────────┐
            │ Groq API SDK  │  │ BM25 RAG   │  │ SQLite/PG DB  │
            │ LPU Inference │  │ Embeddings │  │ Models & Meta │
            └───────────────┘  └────────────┘  └───────────────┘
```

---

## 📂 Project Structure

```
lumi-ai/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI Application Entrypoint
│   │   ├── core/
│   │   │   ├── config.py            # Pydantic Settings & Environment
│   │   │   ├── security.py          # Bcrypt hashing & PyJWT tokens
│   │   │   ├── logging.py           # Structured logging
│   │   │   └── exceptions.py        # Typed HTTP exceptions
│   │   ├── db/
│   │   │   └── session.py           # SQLAlchemy engine & session factory
│   │   ├── models/                  # SQLAlchemy ORM Models
│   │   │   ├── user.py              # User authentication
│   │   │   ├── conversation.py      # Conversation threads
│   │   │   ├── message.py           # Messages & token metadata
│   │   │   ├── document.py          # Documents & chunks
│   │   │   ├── memory.py            # User cross-chat preferences
│   │   │   └── settings.py          # User settings & preferences
│   │   ├── schemas/                 # Pydantic v2 Validation Schemas
│   │   ├── services/
│   │   │   ├── llm/
│   │   │   │   ├── base.py          # Abstract LLM provider
│   │   │   │   ├── groq_provider.py # Real Groq SDK Async Streaming
│   │   │   │   └── registry.py      # Provider registry
│   │   │   ├── chat_service.py      # Chat orchestration & modes
│   │   │   ├── retrieval_service.py # Pure-Python BM25 vector retrieval
│   │   │   ├── document_service.py  # PDF, DOCX, TXT, CSV parsing
│   │   │   ├── analysis_service.py  # Safe CSV dataset profiler
│   │   │   ├── tool_service.py      # Safe AST mathematical evaluation
│   │   │   ├── search_service.py    # DuckDuckGo/Tavily web search
│   │   │   └── voice_service.py     # Groq Whisper audio transcription
│   │   └── api/
│   │       ├── dependencies.py      # Auth & Dev-mode dependencies
│   │       └── routes/              # Modular REST routes
│   ├── tests/
│   │   └── test_api.py              # 9 Comprehensive Pytest test cases
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/Sidebar.tsx   # Sidebar navigation
│   │   │   ├── chat/ChatHeader.tsx  # Header with model/mode selector
│   │   │   ├── chat/MessageItem.tsx # Markdown, code copy, speak
│   │   │   ├── chat/MessageComposer.tsx # Textarea, mic, file attach
│   │   │   ├── chat/WelcomeView.tsx # 6 Clickable suggested prompts
│   │   │   ├── voice/VoiceModal.tsx # Dedicated Voice Assistant mode
│   │   │   ├── documents/DocumentModal.tsx # Knowledge base manager
│   │   │   ├── analysis/AnalysisModal.tsx  # CSV analytics workspace
│   │   │   └── settings/SettingsModal.tsx  # Settings & memories
│   │   ├── services/api.ts          # Centralized API service & SSE reader
│   │   ├── types/index.ts           # TypeScript interfaces
│   │   └── utils/speech.ts          # Web Speech STT/TTS manager
│   ├── package.json
│   ├── tailwind.config.js           # Lumi Lavender/Purple tokens
│   └── vite.config.ts
├── data/                            # Persistent DB & Uploads
├── .env.example                     # Environment template
├── docker-compose.yml
└── README.md
```

---

## ⚡ Quick Start Guide (Windows PowerShell)

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 2. Backend Setup
Open a PowerShell terminal and navigate to the project root:

```powershell
cd C:\Users\admin\.gemini\antigravity-ide\scratch\lumi-ai\backend

# Install dependencies
python -m pip install -r requirements.txt

# Create .env configuration (or copy from .env.example)
Copy-Item ..\.env.example .env

# Optional: Add your Groq API key in .env
# GROQ_API_KEY=gsk_your_actual_key_here

# Run backend test suite
python -m pytest tests -v -p no:cacheprovider

# Start FastAPI development server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend API will start at `http://127.0.0.1:8000` with interactive Swagger docs at `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup
Open a second PowerShell terminal:

```powershell
cd C:\Users\admin\.gemini\antigravity-ide\scratch\lumi-ai\frontend

# Install dependencies
npm install

# Build for production validation
npm run build

# Start Vite dev server
npm run dev
```

The frontend will start at `http://localhost:5173`.

---

## 🧪 Automated Test Results

The backend contains a comprehensive automated Pytest suite validating all critical platform components:

```
tests/test_api.py::test_health_endpoint PASSED                           [ 11%]
tests/test_api.py::test_readiness_endpoint PASSED                        [ 22%]
tests/test_api.py::test_auth_workflow PASSED                             [ 33%]
tests/test_api.py::test_conversation_lifecycle PASSED                    [ 44%]
tests/test_api.py::test_safe_math_tool PASSED                            [ 55%]
tests/test_api.py::test_pure_python_bm25 PASSED                          [ 66%]
tests/test_api.py::test_settings_endpoint PASSED                         [ 77%]
tests/test_api.py::test_document_and_rag_workflow PASSED                 [ 88%]
tests/test_api.py::test_csv_data_analysis_workflow PASSED                [100%]

============================== 9 passed in 2.79s ==============================
```

---

## 🔒 Security Architecture

- **Server-Side API Key Storage:** External credentials (Groq, Tavily, SerpAPI) exist solely on the server and are never delivered to client browsers.
- **Safe Sandboxed Tools:** The built-in mathematical evaluator uses Python's Abstract Syntax Tree (`ast.parse`) with strict operator whitelisting. No `eval()` or `exec()` is ever executed.
- **Untrusted Input Sanitation:** Uploaded documents and live search results are clearly demarcated from system instructions to prevent prompt-injection attacks.
- **Path Traversal Protection:** User uploads are isolated into specific subdirectories with sanitized filenames.

---

## 📱 Progressive Web App (PWA)

Lumi AI is fully configured as an installable Progressive Web App:
- **Standalone Android Experience:** Launches in fullscreen standalone mode without browser URL bars.
- **Service Worker Caching:** Caches static app shell assets (HTML, JS, CSS, icons) safely with background stale-while-revalidate.
- **Strict Privacy in Cache:** Never caches API requests, chat messages, or credentials.
- **Installation:** On Chrome for Android or desktop browsers, tap the browser menu (or the in-app "Install Lumi App" button) and choose "Install" / "Add to Home Screen".

---

## 🛡️ Guest Session Isolation & Security

Lumi AI implements zero-friction personal assistant access while strictly isolating every visitor's private data:
- **Client Session Tokens:** Each browser maintains a private UUID session token in `localStorage` (`lumi_session_id`).
- **Cryptographic Header Verification:** Sent via `X-Session-ID` on all requests.
- **Database Partitioning:** Each visitor is mapped to an isolated user record. Users can never view, update, or delete other users' conversations or uploaded documents.
- **Protected Endpoints:** Account identity (`/api/v1/auth/me`) and administrative actions strictly demand valid JWT Bearer credentials.

---

## 🗄️ Production Database Persistence (Render)

Lumi AI supports both **SQLite** (default zero-config local storage) and **PostgreSQL** (production persistence):

> [!IMPORTANT]
> On Render's Free tier, the container filesystem is ephemeral. Local SQLite database files (`/app/data/lumi.db`) reset upon container restart or code redeployment.

### To Enable Permanent Persistence on Render:
1. In your [Render Dashboard](https://dashboard.render.com), click **New +** > **PostgreSQL**.
2. Give your database a name (e.g. `lumi-db`) and select the **Free** tier.
3. Once created, copy the **Internal Database URL** (or External URL).
4. Go to your **lumi-ai** Web Service > **Environment**.
5. Add/Update the environment variable:
   * **Key:** `DATABASE_URL`
   * **Value:** `postgres://...` (Render's connection string)
6. Save Changes. Lumi AI will automatically convert the connection string, initialize all tables with SQLAlchemy, and persist all conversations, users, settings, and memories permanently across all future redeployments!

---

## 🐳 Docker Deployment

To launch Lumi AI using Docker Compose:

```bash
docker compose up --build -d
```

- Backend API: `http://localhost:8000`
- Frontend Web App: `http://localhost`

---

## 📄 License
MIT License. Built for advanced AI engineering demonstrations and production portfolios.
