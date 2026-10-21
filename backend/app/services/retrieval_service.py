import re
import math
from collections import Counter
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.document import Document, DocumentChunk
from app.schemas.chat import Citation
from app.core.logging import logger

# Common English stopwords
STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't",
    "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can",
    "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't",
    "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have",
    "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him",
    "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't",
    "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor",
    "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out",
    "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some",
    "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there",
    "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to",
    "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were",
    "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's",
    "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're",
    "you've", "your", "yours", "yourself", "yourselves"
}

def tokenize(text: str) -> List[str]:
    words = re.findall(r'\b[a-zA-Z0-9_-]+\b', text.lower())
    return [w for w in words if w not in STOPWORDS and len(w) > 1]

class PurePythonBM25:
    """High-performance, lightweight pure-Python BM25 vector retrieval engine without external C-extensions."""
    def __init__(self, corpus: List[List[str]], k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.corpus_size = len(corpus)
        self.avg_dl = sum(len(doc) for doc in corpus) / max(1, self.corpus_size)
        self.doc_freqs = Counter()
        self.doc_lens = [len(doc) for doc in corpus]
        self.doc_counters = [Counter(doc) for doc in corpus]

        for doc in corpus:
            unique_tokens = set(doc)
            for token in unique_tokens:
                self.doc_freqs[token] += 1

    def score(self, query_tokens: List[str]) -> List[float]:
        scores = [0.0] * self.corpus_size
        for token in query_tokens:
            if token not in self.doc_freqs:
                continue
            df = self.doc_freqs[token]
            idf = math.log(1.0 + (self.corpus_size - df + 0.5) / (df + 0.5))
            for i in range(self.corpus_size):
                tf = self.doc_counters[i].get(token, 0)
                if tf > 0:
                    numerator = tf * (self.k1 + 1.0)
                    denominator = tf + self.k1 * (1.0 - self.b + self.b * (self.doc_lens[i] / self.avg_dl))
                    scores[i] += idf * (numerator / denominator)
        return scores

class RetrievalService:
    @staticmethod
    def retrieve_relevant_chunks(
        db: Session,
        query: str,
        document_ids: Optional[List[str]] = None,
        user_id: Optional[str] = None,
        top_k: int = 4
    ) -> List[Dict[str, Any]]:
        query_tokens = tokenize(query)
        if not query_tokens:
            return []

        # Query chunks from DB
        chunk_query = db.query(DocumentChunk, Document.filename).join(Document)
        if user_id:
            chunk_query = chunk_query.filter(Document.user_id == user_id)
        if document_ids:
            chunk_query = chunk_query.filter(Document.id.in_(document_ids))

        rows = chunk_query.all()
        if not rows:
            return []

        chunks_data = []
        tokenized_corpus = []
        for chunk, filename in rows:
            chunks_data.append({
                "chunk_id": chunk.id,
                "document_id": chunk.document_id,
                "filename": filename,
                "chunk_index": chunk.chunk_index,
                "content": chunk.content
            })
            tokenized_corpus.append(tokenize(chunk.content))

        if not tokenized_corpus:
            return []

        try:
            engine = PurePythonBM25(tokenized_corpus)
            scores = engine.score(query_tokens)

            # Pair and sort
            ranked = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)

            results = []
            for idx, score in ranked[:top_k]:
                if score > 0.05:
                    item = chunks_data[idx].copy()
                    item["score"] = round(score, 4)
                    results.append(item)

            return results
        except Exception as e:
            logger.error(f"Error during retrieval: {e}")
            return []

    @staticmethod
    def format_rag_context(chunks: List[Dict[str, Any]]) -> Tuple[str, List[Citation]]:
        if not chunks:
            return "", []

        context_parts = []
        citations = []
        for i, c in enumerate(chunks, 1):
            source_label = f"[{i}] {c['filename']} (Section {c['chunk_index'] + 1})"
            context_parts.append(f"Source {source_label}:\n{c['content']}\n")
            citations.append(Citation(
                source=c['filename'],
                content=c['content'][:300] + ("..." if len(c['content']) > 300 else ""),
                relevance_score=c.get('score'),
                chunk_id=c.get('chunk_id')
            ))

        formatted_context = "\n".join(context_parts)
        return formatted_context, citations

retrieval_service = RetrievalService()
