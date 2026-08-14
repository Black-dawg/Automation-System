import fitz
import base64
import hashlib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from langchain_community.chat_models import ChatOllama
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.documents import Document
from langchain_core.prompts import PromptTemplate

from database import engine, init_db, vector_store, OLLAMA_URL
from schemas import IngestReq, AutofillReq

# Initialize tables on startup
init_db()

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.post("/api/v1/rag/ingest")
def ingest(req: IngestReq):
    doc_hash = hashlib.sha256(req.resumeBase64.encode('utf-8')).hexdigest()
    doc_id = f"doc_{doc_hash}"

    with engine.begin() as conn:
        active = conn.execute(text("SELECT doc_id FROM active_doc WHERE id=1")).fetchone()
        if active and active[0] == doc_id:
            return {"status": "success", "documentId": doc_id, "sections": []}

        try:
            pdf_bytes = base64.b64decode(req.resumeBase64)
            doc = fitz.open("pdf", pdf_bytes)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid PDF")
        
        toc = doc.get_toc()
        sections = []
        
        if not toc:
            for i, page in enumerate(doc):
                text_content = page.get_text("text").strip()
                if text_content:
                    sections.append({"title": f"Page {i+1}", "content": text_content})
        else:
            for i in range(len(toc)):
                lvl, title, start_page = toc[i][:3]
                end_page = len(doc) + 1
                for j in range(i + 1, len(toc)):
                    if toc[j][0] <= lvl:
                        end_page = toc[j][2]
                        break
                        
                start_idx = max(0, start_page - 1)
                end_idx = min(len(doc), end_page)
                text_content = "".join([doc[p].get_text("text") + "\n" for p in range(start_idx, end_idx)]).strip()
                if text_content:
                    sections.append({"title": title, "content": text_content})
        doc.close()

        documents = [
            Document(page_content=sec["content"], metadata={"doc_id": doc_id, "title": sec["title"]})
            for sec in sections
        ]
        
        # Add to LangChain vector store and update active doc
        vector_store.add_documents(documents)
        conn.execute(
            text("INSERT INTO active_doc (id, doc_id) VALUES (1, :doc_id) ON CONFLICT (id) DO UPDATE SET doc_id = :doc_id"),
            {"doc_id": doc_id}
        )

    return {"status": "success", "documentId": doc_id, "sections": [s["title"] for s in sections]}


@app.post("/api/v1/rag/autofill")
def autofill(req: AutofillReq):
    answers = {}
    
    with engine.begin() as conn:
        active = conn.execute(text("SELECT doc_id FROM active_doc WHERE id=1")).fetchone()
        if not active:
            raise HTTPException(status_code=400, detail="No active resume found")
        active_doc_id = active[0]

    llm = ChatOllama(model=req.model or "qwen2.5:7b-instruct", base_url=OLLAMA_URL, format="json", temperature=0.3)
    parser = JsonOutputParser()
    prompt = PromptTemplate.from_template(
        """Use the Resume Context to answer the form question.
If you can't find it, answer "Not specified".

Context:
{context}

Question: "{question}"
Type: {field_type}
{options}

Return JSON like: {{ "{field_id}": "answer" }}
"""
    )
    chain = prompt | llm | parser

    for field in req.formFields:
        try:
            results = vector_store.similarity_search(
                query=field.fieldLabel, 
                k=2,
                filter={"doc_id": {"$eq": active_doc_id}}
            )
            context_str = "\n".join([f"--- {doc.metadata.get('title', 'Section')} ---\n{doc.page_content}" for doc in results])
            opts_str = f"Options: {', '.join(field.options)}" if field.options else ""
            
            ans_data = chain.invoke({
                "context": context_str,
                "question": field.fieldLabel,
                "field_type": field.fieldType,
                "options": opts_str,
                "field_id": field.fieldId
            })
            
            if field.fieldId in ans_data:
                answers[field.fieldId] = ans_data[field.fieldId]
            else:
                answers[field.fieldId] = list(ans_data.values())[0] if ans_data else ""
        except Exception:
            answers[field.fieldId] = ""

    return {"status": "success", "answers": answers}
