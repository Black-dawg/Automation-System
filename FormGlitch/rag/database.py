from sqlalchemy import create_engine, text
from langchain_community.embeddings import OllamaEmbeddings
from langchain_postgres import PGVector

DB_URL = "postgresql+psycopg://postgres:postgres@localhost:5432/formglitch_db"
OLLAMA_URL = "http://localhost:11434"

# Set up raw engine for manual table operations
engine = create_engine(DB_URL)

def init_db():
    with engine.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS active_doc (
                id INT PRIMARY KEY DEFAULT 1,
                doc_id VARCHAR(64) NOT NULL
            );
        """))

# LangChain Vector Store Setup
embeddings = OllamaEmbeddings(model="nomic-embed-text", base_url=OLLAMA_URL)

vector_store = PGVector(
    embeddings=embeddings,
    collection_name="resume_vectors",
    connection=engine,
    use_jsonb=True
)
