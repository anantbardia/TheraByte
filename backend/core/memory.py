import os
import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions
import uuid

# Provide absolute path for ChromaDB storage
CHROMA_DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_data")

import os
import chromadb
from chromadb.config import Settings
import uuid

# Provide absolute path for ChromaDB storage
CHROMA_DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_data")

# Global variables for lazy loading
_client = None
_memory_collection = None

def _get_collection():
    """Lazily initializes the ChromaDB client and collection on first use to prevent blocking app startup."""
    global _client, _memory_collection
    
    if _memory_collection is not None:
        return _memory_collection

    try:
        if _client is None:
            _client = chromadb.PersistentClient(path=CHROMA_DB_DIR, settings=Settings(allow_reset=True, anonymized_telemetry=False))
            
        # Wait to get/create the collection. ChromaDB's default embedding function
        # uses the ONNX version of all-MiniLM-L6-v2 which doesn't require PyTorch.
        # This saves ~1.5GB of RAM and starts instantly.
        _memory_collection = _client.get_or_create_collection(
            name="mindbridge_memories",
            metadata={"hnsw:space": "cosine"}
        )
    except Exception as e:
        if "Embedding function conflict" in str(e) or "already exists" in str(e):
            print("Embedding function conflict detected. Recreating collection...")
            if _client:
                _client.delete_collection("mindbridge_memories")
                _memory_collection = _client.get_or_create_collection(
                    name="mindbridge_memories",
                    metadata={"hnsw:space": "cosine"}
                )
        else:
            print(f"Error initializing ChromaDB Collection: {e}")
            
    return _memory_collection

def store_memory(user_id: str, role: str, content: str):
    """
    Stores a conversational message into the vector database.
    """
    collection = _get_collection()
    if not collection:
        return
        
    # We only want to store meaningful content, ignore very short/empty messages
    if not content or len(content.strip()) < 5:
        return

    doc_id = str(uuid.uuid4())
    
    # Store the role in metadata to filter later if needed
    metadata = {
        "user_id": user_id,
        "role": role,
    }

    try:
        collection.add(
            documents=[content],
            metadatas=[metadata],
            ids=[doc_id]
        )
    except Exception as e:
        print(f"Failed to store memory: {e}")

def retrieve_relevant_memories(user_id: str, query: str, k: int = 3) -> str:
    """
    Retrieves the top-k most semantically similar past interactions for a specific user.
    """
    collection = _get_collection()
    if not collection:
        return ""
        
    try:
        results = collection.query(
            query_texts=[query],
            n_results=k,
            where={"user_id": user_id} # Only query memories belonging to this user
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
