import chromadb
import os

CHROMA_HOST = os.getenv("CHROMA_HOST", "localhost")
CHROMA_PORT = int(os.getenv("CHROMA_PORT", 8001))

def get_client():
    return chromadb.HttpClient(
        host=CHROMA_HOST,
        port=CHROMA_PORT,
        tenant="default_tenant",
        database="default_database",
    )

def get_or_create_collection(name: str = "knowledge_base"):
    return get_client().get_or_create_collection(name=name)

def add_documents(docs: list[dict]):
    collection = get_or_create_collection()
    collection.add(
        ids=[d["id"] for d in docs],
        documents=[d["text"] for d in docs],
        metadatas=[d.get("metadata", {}) for d in docs],
    )

def retrieve(query: str, n_results: int = 3) -> list[dict]:
    collection = get_or_create_collection()
    results = collection.query(query_texts=[query], n_results=n_results)
    output = []
    for i, doc in enumerate(results["documents"][0]):
        output.append({
            "chunk_id": results["ids"][0][i],
            "text": doc,
            "score": round(1 - results["distances"][0][i], 4),
            "metadata": results["metadatas"][0][i],
        })
    return output