import os
import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions
import uuid

# Provide absolute path for ChromaDB storage
CHROMA_DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_data")

# Initialize persistent ChromaDB client
try:
    client = chromadb.PersistentClient(path=CHROMA_DB_DIR, settings=Settings(allow_reset=True, anonymized_telemetry=False))
except Exception as e:
    print(f"Failed to initialize ChromaDB Client: {e}")
    client = None

# Use Sentence Transformers directly (more reliable repo than ONNX S3)
try:
    hf_ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
except Exception as e:
    print(f"Failed to load sentence transformer: {e}")
    hf_ef = None

# Create or get the main collection for conversation memory
if client:
    try:
        memory_collection = client.get_or_create_collection(
            name="mindbridge_memories",
            embedding_function=hf_ef,
            metadata={"hnsw:space": "cosine"} # Use cosine similarity for semantic search
        )
    except Exception as e:
        if "Embedding function conflict" in str(e) or "already exists" in str(e):
            print("Embedding function conflict detected. Recreating collection...")
            client.delete_collection("mindbridge_memories")
            memory_collection = client.get_or_create_collection(
                name="mindbridge_memories",
                embedding_function=hf_ef,
                metadata={"hnsw:space": "cosine"}
            )
        else:
            print(f"Error initializing ChromaDB Collection: {e}")
            memory_collection = None
else:
    memory_collection = None

def store_memory(user_id: str, role: str, content: str):
    """
    Stores a conversational message into the vector database.
    """
    if not memory_collection:
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
        memory_collection.add(
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
    if not memory_collection:
        return ""
        
    try:
        results = memory_collection.query(
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
