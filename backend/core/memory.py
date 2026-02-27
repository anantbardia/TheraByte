import os
import uuid

# Provide absolute path for ChromaDB storage
CHROMA_DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_data")

# Global variables for lazy loading
_client = None
_memory_collection = None


def _get_collection():
    """
    Lazily initializes the ChromaDB client and collection on first use.

    Uses FastEmbed (BAAI/bge-small-en-v1.5 via ONNX) — a genuine semantic neural
    embedding model that fits in <60 MB RAM. No PyTorch, no HuggingFace Transformers.
    Downloads once (~33 MB) and caches to disk automatically.
    """
    global _client, _memory_collection

    if _memory_collection is not None:
        return _memory_collection

    try:
        import chromadb
        from chromadb.config import Settings
        from chromadb.utils.embedding_functions import FastEmbedEmbeddingFunction

        if _client is None:
            _client = chromadb.PersistentClient(
                path=CHROMA_DB_DIR,
                settings=Settings(allow_reset=True, anonymized_telemetry=False),
            )

        # FastEmbed uses BAAI/bge-small-en-v1.5 — a proper transformer trained on
        # semantic similarity tasks. It is quantized/ONNX-optimised so it uses
        # ~50 MB RAM vs ~300 MB for sentence-transformers+PyTorch.
        ef = FastEmbedEmbeddingFunction(
            model_name="BAAI/bge-small-en-v1.5",
            cache_dir=os.path.join(os.path.dirname(os.path.dirname(__file__)), "embed_cache"),
        )

        _memory_collection = _client.get_or_create_collection(
            name="mindbridge_memories_v3",  # v3 = fastembed neural collection
            embedding_function=ef,
            metadata={"hnsw:space": "cosine"},
        )
    except Exception as e:
        print(f"Error initializing ChromaDB Collection: {e}")

    return _memory_collection


def store_memory(user_id: str, role: str, content: str):
    """Stores a conversational message into the vector database."""
    collection = _get_collection()
    if not collection:
        return

    if not content or len(content.strip()) < 5:
        return

    doc_id = str(uuid.uuid4())
    metadata = {"user_id": user_id, "role": role}

    try:
        collection.add(
            documents=[content],
            metadatas=[metadata],
            ids=[doc_id],
        )
    except Exception as e:
        print(f"Failed to store memory: {e}")


def retrieve_relevant_memories(user_id: str, query: str, k: int = 3) -> str:
    """Retrieves the top-k most semantically similar past interactions for a specific user."""
    collection = _get_collection()
    if not collection:
        return ""

    try:
        results = collection.query(
            query_texts=[query],
            n_results=k,
            where={"user_id": user_id},
        )

        memories = []
        if results and results.get("documents") and len(results["documents"]) > 0:
            for idx, doc in enumerate(results["documents"][0]):
                role = results["metadatas"][0][idx].get("role", "unknown")
                memories.append(f"[{role.upper()}]: {doc}")

        return "\n".join(memories) if memories else ""
    except Exception as e:
        print(f"Failed to retrieve memory: {e}")
        return ""
