import os
import uuid
import hashlib
import math

# Provide absolute path for ChromaDB storage
CHROMA_DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_data")

# Global variables for lazy loading
_client = None
_memory_collection = None


# ─────────────────────────────────────────────────────────────────────────────
# Ultra-lightweight embedding function — pure Python, ZERO external downloads.
# Uses character-level n-gram hashing into a fixed 128-dim vector.
# No PyTorch, no ONNX, no HuggingFace. Fits comfortably inside 512MB.
# Quality: adequate for basic semantic similarity in a therapy context.
# ─────────────────────────────────────────────────────────────────────────────
_DIM = 128  # embedding dimensionality

def _hash_embed(texts: list) -> list:
    """
    Convert each text to a 128-d float vector via character trigram hashing.
    Returns a list of 128-element lists (matching ChromaDB EmbeddingFunction signature).
    """
    results = []
    for text in texts:
        text = (text or "").lower()
        vec = [0.0] * _DIM
        # slide a window of 3 characters across the text
        for i in range(len(text) - 2):
            trigram = text[i:i + 3]
            h = int(hashlib.md5(trigram.encode()).hexdigest(), 16)
            bucket = h % _DIM
            vec[bucket] += 1.0

        # L2-normalise so cosine distance works correctly
        norm = math.sqrt(sum(x * x for x in vec)) or 1.0
        results.append([x / norm for x in vec])
    return results


class _TinyEmbedFn:
    """ChromaDB-compatible embedding function wrapper."""
    def __call__(self, input: list) -> list:  # noqa: A002
        return _hash_embed(input)


_EMBED_FN = _TinyEmbedFn()


def _get_collection():
    """Lazily initializes the ChromaDB client and collection on first use."""
    global _client, _memory_collection

    if _memory_collection is not None:
        return _memory_collection

    try:
        import chromadb
        from chromadb.config import Settings

        if _client is None:
            _client = chromadb.PersistentClient(
                path=CHROMA_DB_DIR,
                settings=Settings(allow_reset=True, anonymized_telemetry=False),
            )

        # Use our tiny pure-Python embedding function — NO HuggingFace downloads.
        _memory_collection = _client.get_or_create_collection(
            name="mindbridge_memories_v2",   # new name avoids conflict with old ONNX collection
            embedding_function=_EMBED_FN,
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
    """Retrieves the top-k most similar past interactions for a specific user."""
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
