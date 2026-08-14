# FormGlitch RAG Microservice

![Python Version](https://img.shields.io/badge/python-3.10%2B-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688)
![LangChain](https://img.shields.io/badge/LangChain-0.2.14-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2B-336791)
![License](https://img.shields.io/badge/license-MIT-green)

A high-performance, fully local Retrieval-Augmented Generation (RAG) microservice built for the FormGlitch Chrome Extension. This service leverages LangChain, Ollama, and PostgreSQL (`pgvector`) to seamlessly parse, vectorize, and query resumes for intelligent form autofilling.

---

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Development](#development)

---

## Architecture Overview
The FormGlitch RAG microservice is designed for a single-user environment to ensure maximum performance and data privacy. 

- **PDF Parsing**: Utilizes `PyMuPDF` to intelligently extract resume sections based on structural bookmarks rather than arbitrary text chunks.
- **Vector Storage**: Integrates LangChain's `PGVector` wrapper to store and index high-dimensional embeddings.
- **Local Generation**: Queries a local Ollama instance (`qwen2.5:7b-instruct`) using LangChain Expression Language (LCEL) chains, guaranteeing zero data leakage to third-party APIs.

For an in-depth technical breakdown, please refer to the [`RAG_ARCHITECTURE.md`](RAG_ARCHITECTURE.md).

---

## Prerequisites
Ensure your system meets the following requirements before proceeding:
- **Python**: `v3.10` or higher
- **PostgreSQL**: `v16.0` or higher with the [pgvector](https://github.com/pgvector/pgvector) extension enabled.
- **Ollama**: Running locally on `http://localhost:11434`

### Required Local Models
Pull the necessary models into your local Ollama instance:
```bash
ollama pull qwen2.5:7b-instruct
ollama pull nomic-embed-text
```

---

## Installation & Setup

1. **Clone the repository and navigate to the project directory:**
   ```bash
   cd FormGlitch/rag
   ```

2. **Initialize a Python Virtual Environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Initialize the Database:**
   Ensure your local PostgreSQL instance is running. The application will automatically attempt to create the necessary `vector` extension and tables upon startup.

5. **Start the Application:**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

---

## Configuration
Environment variables can be configured directly in `database.py` or exported in your shell environment prior to startup.

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `DB_URL` | `postgresql+psycopg://postgres:postgres@localhost:5432/formglitch_db` | Connection string for PostgreSQL |
| `OLLAMA_URL` | `http://localhost:11434` | Base URL for the local Ollama API |

---

## API Reference

### 1. Ingest Resume
Parses a base64 encoded PDF and updates the active vector context.
- **Endpoint**: `POST /api/v1/rag/ingest`
- **Payload**:
  ```json
  {
    "resumeBase64": "JVBERi0xLjQKJ...",
    "model": "qwen2.5:7b-instruct"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "documentId": "doc_8a7b...",
    "sections": ["Education", "Experience"]
  }
  ```

### 2. Autofill Form Fields
Performs a semantic similarity search against the active resume and generates context-aware answers.
- **Endpoint**: `POST /api/v1/rag/autofill`
- **Payload**:
  ```json
  {
    "formFields": [
      {
        "fieldId": "exp_1",
        "fieldLabel": "Years of Experience",
        "fieldType": "text",
        "options": []
      }
    ],
    "model": "qwen2.5:7b-instruct"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "answers": {
      "exp_1": "3 Years"
    }
  }
  ```

---

## Development
To run the server in development mode with auto-reload enabled, use:
```bash
uvicorn main:app --reload
```
Swagger UI documentation is automatically generated and accessible at `http://localhost:8000/docs` while the server is running.
