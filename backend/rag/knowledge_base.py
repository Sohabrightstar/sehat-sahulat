"""
Minimal RAG setup — intentionally small and simple for a hackathon timeline.

- 8 short original articles in kb_articles/ (swap in more/real WHO/MedlinePlus-sourced
  summaries later if you want, just keep them as your own written summaries, not
  copy-pasted text, to avoid copyright issues).
- Chunked at paragraph level (good enough at this scale — no need for a fancy splitter).
- Embedded with a free local model (sentence-transformers), so RAG costs nothing and
  doesn't depend on a second API key.
- Chroma persists to ./chroma_store so you don't re-embed on every server restart.
"""
import os
import glob
try:
    import chromadb
    from chromadb.utils import embedding_functions
    HAS_CHROMADB = True
except ImportError:
    HAS_CHROMADB = False

_HERE = os.path.dirname(os.path.abspath(__file__))
_KB_DIR = os.path.join(_HERE, "kb_articles")
_STORE_DIR = os.path.join(_HERE, "chroma_store")
_COLLECTION_NAME = "medical_kb"

if HAS_CHROMADB:
    try:
        _embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        _client = chromadb.PersistentClient(path=_STORE_DIR)
    except Exception as e:
        print(f"[knowledge_base] Failed to initialize ChromaDB: {e}")
        HAS_CHROMADB = False


def _chunk_article(text: str):
    """Paragraph-level chunking. Simple on purpose — fine at this KB size."""
    return [p.strip() for p in text.split("\n\n") if p.strip()]


def get_collection():
    if not HAS_CHROMADB:
        return None
    collection = _client.get_or_create_collection(
        name=_COLLECTION_NAME, embedding_function=_embedding_fn
    )
    if collection.count() == 0:
        _ingest_all(collection)
    return collection


def _ingest_all(collection):
    ids, docs, metadatas = [], [], []
    for filepath in sorted(glob.glob(os.path.join(_KB_DIR, "*.txt"))):
        source = os.path.basename(filepath)
        with open(filepath, "r", encoding="utf-8") as f:
            text = f.read()
        for i, chunk in enumerate(_chunk_article(text)):
            ids.append(f"{source}-{i}")
            docs.append(chunk)
            metadatas.append({"source": source})
    if docs:
        collection.add(ids=ids, documents=docs, metadatas=metadatas)
        print(f"[knowledge_base] Ingested {len(docs)} chunks from {len(glob.glob(os.path.join(_KB_DIR, '*.txt')))} articles.")


def retrieve(query: str, top_k: int = 3) -> list[str]:
    """Return the top_k most relevant chunks for a query string."""
    if HAS_CHROMADB:
        try:
            collection = get_collection()
            if collection is not None:
                results = collection.query(query_texts=[query], n_results=top_k)
                if results and "documents" in results and results["documents"]:
                    return results["documents"][0]
        except Exception as e:
            print(f"[knowledge_base] Retrieval failed via ChromaDB: {e}")

    # Fallback: direct reading of knowledge base text articles
    chunks = []
    for filepath in sorted(glob.glob(os.path.join(_KB_DIR, "*.txt"))):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                chunks.extend(_chunk_article(f.read()))
        except Exception:
            pass
    return chunks[:top_k]

