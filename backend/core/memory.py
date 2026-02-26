import os
import uuid

# Keep vector memory opt-in for low-memory deployments (e.g. Render free 512Mi).
ENABLE_VECTOR_MEMORY = os.getenv("ENABLE_VECTOR_MEMORY", "false").strip().lower() in {
    "1", "true", "yes", "on"
}
CHROMA_DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_data")

_client = None
_memory_collection = None
_init_attempted = False


def _ensure_initialized() -> bool:
    """
    Lazily initialize ChromaDB + embedding model on first access.
    This avoids heavy startup memory usage before the web server binds to a port.
    """
    global _client, _memory_collection, _init_attempted

    if _memory_collection is not None:
        return True
    if _init_attempted:
        return False

    _init_attempted = True

    if not ENABLE_VECTOR_MEMORY:
        return False

    try:
        import chromadb
        from chromadb.config import Settings
        from chromadb.utils import embedding_functions

        _client = chromadb.PersistentClient(
            path=CHROMA_DB_DIR,
            settings=Settings(allow_reset=True, anonymized_telemetry=False),
        )

        hf_ef = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )

        _memory_collection = _client.get_or_create_collection(
            name="mindbridge_memories",
            embedding_function=hf_ef,
            metadata={"hnsw:space": "cosine"},
        )
        return True
    except Exception as e:
        print(f"Vector memory initialization failed: {e}")
        _memory_collection = None
        return False


def store_memory(user_id: str, role: str, content: str):
    """Stores a conversational message into the vector database."""
    if not _ensure_initialized():
        return

    if not content or len(content.strip()) < 5:
        return

    doc_id = str(uuid.uuid4())
    metadata = {
        "user_id": user_id,
        "role": role,
    }

    try:
        _memory_collection.add(
            documents=[content],
            metadatas=[metadata],
            ids=[doc_id],
        )
    except Exception as e:
        print(f"Failed to store memory: {e}")


def retrieve_relevant_memories(user_id: str, query: str, k: int = 3) -> str:
    """Retrieves top-k semantically similar past interactions for a specific user."""
    if not _ensure_initialized():
        return ""

    try:
        results = _memory_collection.query(
            query_texts=[query],
            n_results=k,
            where={"user_id": user_id},
        )

        memories = []
        if results and results.get("documents") and len(results["documents"]) > 0:
            for idx, doc in enumerate(results["documents"][0]):
                role = results["metadatas"][0][idx].get("role", "unknown")
                memories.append(f"[{role.upper()}]: {doc}")

        if memories:
            return "\n".join(memories)
        return ""
    except Exception as e:
        print(f"Failed to retrieve memory: {e}")
        return ""
