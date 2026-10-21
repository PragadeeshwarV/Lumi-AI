import os
import json
from pathlib import Path
from typing import List, Dict, Any, Tuple
from fastapi import UploadFile
import pypdf
import docx
from app.core.config import settings
from app.core.logging import logger
from app.core.exceptions import LumiException

class DocumentService:
    @staticmethod
    def extract_text(file_path: Path, file_type: str) -> str:
        file_type = file_type.lower()
        text = ""

        try:
            if file_type == "pdf" or str(file_path).endswith(".pdf"):
                reader = pypdf.PdfReader(str(file_path))
                pages_text = []
                for i, page in enumerate(reader.pages):
                    pt = page.extract_text() or ""
                    if pt.strip():
                        pages_text.append(f"--- [Page {i+1}] ---\n{pt.strip()}")
                text = "\n\n".join(pages_text)

            elif file_type in ["docx", "doc"] or str(file_path).endswith((".docx", ".doc")):
                doc = docx.Document(str(file_path))
                paras = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
                text = "\n\n".join(paras)

            elif file_type in ["txt", "md", "markdown"] or str(file_path).endswith((".txt", ".md")):
                with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                    text = f.read()

            elif file_type == "csv" or str(file_path).endswith(".csv"):
                import csv
                with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                    r = csv.reader(f)
                    header = next(r, [])
                    preview_rows = [next(r, None) for _ in range(10)]
                    preview_rows = [p for p in preview_rows if p is not None]
                text = f"CSV Dataset Summary:\nColumns: {', '.join(header)}\n\nSample Rows:\n"
                for row in preview_rows:
                    text += "- " + ", ".join(row) + "\n"

            elif file_type == "json" or str(file_path).endswith(".json"):
                with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                    data = json.load(f)
                    text = json.dumps(data, indent=2)

            else:
                # Fallback text read
                with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                    text = f.read()

        except Exception as e:
            logger.error(f"Error parsing file {file_path}: {e}")
            raise LumiException(status_code=400, detail=f"Failed to parse document content: {str(e)}")

        return text.strip()

    @staticmethod
    def chunk_text(text: str, chunk_size: int = None, chunk_overlap: int = None) -> List[str]:
        if chunk_size is None:
            chunk_size = settings.CHUNK_SIZE
        if chunk_overlap is None:
            chunk_overlap = settings.CHUNK_OVERLAP

        if not text:
            return []

        # Split into paragraphs or sentences
        paragraphs = text.split("\n\n")
        chunks = []
        current_chunk = ""

        for p in paragraphs:
            p = p.strip()
            if not p:
                continue

            if len(current_chunk) + len(p) + 2 <= chunk_size:
                if current_chunk:
                    current_chunk += "\n\n" + p
                else:
                    current_chunk = p
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                    # Start next with overlap from the tail of current chunk
                    overlap_start = max(0, len(current_chunk) - chunk_overlap)
                    current_chunk = current_chunk[overlap_start:] + "\n\n" + p
                else:
                    # Single paragraph exceeds chunk size, split by lines or characters
                    for i in range(0, len(p), chunk_size - chunk_overlap):
                        chunks.append(p[i:i + chunk_size])
                    current_chunk = ""

        if current_chunk.strip():
            chunks.append(current_chunk.strip())

        return chunks

document_service = DocumentService()
