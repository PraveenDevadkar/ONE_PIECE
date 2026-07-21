import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ── RAG ENGINE ───────────────────────────────────────────────────
# Loads your personal knowledge files into ChromaDB
# so the crew can answer questions about your life,
# goals, skills, schedule and health

KNOWLEDGE_DIR = os.getenv(
    "KNOWLEDGE_DIR",
    os.path.join(os.path.dirname(__file__), "..", "knowledge")
)

_index = None  # global index — loaded once on startup


def load_knowledge() -> bool:
    """
    Load all markdown files from the knowledge folder into ChromaDB.
    Returns True if successful, False if no files found.
    Call this once when the backend starts.
    """
    global _index

    knowledge_path = Path(KNOWLEDGE_DIR)

    if not knowledge_path.exists():
        print(f"Knowledge folder not found at {knowledge_path}")
        print("Create the folder and add your .md files to enable RAG")
        return False

    md_files = list(knowledge_path.glob("*.md"))
    if not md_files:
        print("No .md files found in knowledge folder — RAG disabled")
        return False

    try:
        import chromadb
        from llama_index.core import (
            VectorStoreIndex,
            SimpleDirectoryReader,
            StorageContext,
        )
        from llama_index.vector_stores.chroma import ChromaVectorStore
        from llama_index.core.node_parser import SentenceSplitter

        print(f"Loading {len(md_files)} knowledge files...")

        # Set up ChromaDB persistent storage
        chroma_path = os.path.join(os.path.dirname(__file__), "chroma_db")
        chroma_client     = chromadb.PersistentClient(path=chroma_path)
        chroma_collection = chroma_client.get_or_create_collection("nakama_knowledge")

        # Set up vector store
        vector_store    = ChromaVectorStore(chroma_collection=chroma_collection)
        storage_context = StorageContext.from_defaults(vector_store=vector_store)

        # Load documents from knowledge folder
        documents = SimpleDirectoryReader(
            input_dir      = str(knowledge_path),
            required_exts  = [".md"],
            recursive      = False
        ).load_data()

        # Split into chunks for better retrieval
        splitter = SentenceSplitter(chunk_size=512, chunk_overlap=50)

        # Build the index
        _index = VectorStoreIndex.from_documents(
            documents,
            storage_context = storage_context,
            transformations = [splitter],
            show_progress   = True
        )

        print(f"RAG loaded successfully — {len(documents)} documents indexed")
        return True

    except ImportError as e:
        print(f"RAG dependencies not installed: {e}")
        print("Run: pip install llama-index llama-index-vector-stores-chroma chromadb")
        return False
    except Exception as e:
        print(f"RAG loading error: {e}")
        return False


def query_knowledge(question: str, character: str = "luffy") -> str:
    """
    Query the personal knowledge base for context relevant to the question.
    Returns a string of relevant context to inject into the character prompt.
    Returns empty string if RAG not available.
    """
    global _index

    if _index is None:
        return ""

    try:
        # Build character-aware query
        # Each crew member queries for their relevant domain
        domain_queries = {
            "zoro":    f"skills learning goals progress {question}",
            "nami":    f"career job goals travel plans {question}",
            "usopp":   f"projects hobbies creative interests {question}",
            "sanji":   f"food diet nutrition preferences {question}",
            "chopper": f"health sleep exercise symptoms {question}",
            "robin":   f"research notes journal knowledge {question}",
            "franky":  f"tech tools setup computer {question}",
            "brook":   f"music entertainment mood hobbies {question}",
            "jinbe":   f"schedule tasks routine productivity {question}",
            "luffy":   question,
        }

        query = domain_queries.get(character, question)

        # Query the index
        query_engine = _index.as_query_engine(
            similarity_top_k = 3,  # get top 3 most relevant chunks
        )

        response = query_engine.query(query)
        result   = str(response).strip()

        if result and result != "Empty Response":
            return result
        return ""

    except Exception as e:
        print(f"RAG query error: {e}")
        return ""


def is_rag_available() -> bool:
    """Check if RAG index is loaded and ready"""
    return _index is not None
