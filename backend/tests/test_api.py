import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.tool_service import tool_service
from app.services.retrieval_service import tokenize, PurePythonBM25
from app.services.analysis_service import analysis_service

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "database_connected" in data

def test_readiness_endpoint():
    response = client.get("/api/v1/readiness")
    assert response.status_code == 200
    assert response.json()["ready"] is True

def test_auth_workflow():
    test_email = "testuser@lumiai.local"
    test_password = "securepassword123"

    # Protected endpoint requires authentication
    unauth_resp = client.get("/api/v1/auth/me")
    assert unauth_resp.status_code == 401
    assert "Authentication required" in unauth_resp.json()["detail"]

    # Register
    reg_resp = client.post("/api/v1/auth/register", json={
        "email": test_email,
        "password": test_password,
        "full_name": "Test User"
    })
    if reg_resp.status_code == 201:
        assert "access_token" in reg_resp.json()

    # Login
    login_resp = client.post("/api/v1/auth/login", json={
        "email": test_email,
        "password": test_password
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Me with valid token
    me_resp = client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == test_email

def test_guest_personal_assistant_access():
    from app.core.config import settings
    orig_env = settings.APP_ENV
    try:
        # Simulate strict production environment
        settings.APP_ENV = "production"

        # Settings access without token works seamlessly
        settings_resp = client.get("/api/v1/settings/")
        assert settings_resp.status_code == 200

        # Conversation creation without token works seamlessly
        conv_resp = client.post("/api/v1/conversations/", json={
            "title": "Guest Session Chat",
            "assistant_mode": "general",
            "model_name": "qwen/qwen3.8-27b"
        })
        assert conv_resp.status_code == 201

        # Protected administrative/account endpoint is still strictly guarded
        protected_resp = client.get("/api/v1/auth/me")
        assert protected_resp.status_code == 401
    finally:
        settings.APP_ENV = orig_env

def test_guest_session_isolation_and_ownership():
    headers_a = {"X-Session-ID": "session-user-alpha-99"}
    headers_b = {"X-Session-ID": "session-user-beta-88"}

    # User A creates a private conversation
    resp_a = client.post("/api/v1/conversations/", json={
        "title": "Alpha Secret Conversation",
        "assistant_mode": "general",
        "model_name": "qwen/qwen3.8-27b"
    }, headers=headers_a)
    assert resp_a.status_code == 201
    conv_a_id = resp_a.json()["id"]

    # User B lists conversations: must NOT see User A's conversation
    list_b = client.get("/api/v1/conversations/", headers=headers_b)
    assert list_b.status_code == 200
    b_conv_ids = [c["id"] for c in list_b.json()]
    assert conv_a_id not in b_conv_ids

    # User B cannot access User A's conversation
    get_b = client.get(f"/api/v1/conversations/{conv_a_id}", headers=headers_b)
    assert get_b.status_code == 404

    # User B cannot delete User A's conversation
    del_b = client.delete(f"/api/v1/conversations/{conv_a_id}", headers=headers_b)
    assert del_b.status_code == 404

    # User A can access their own conversation
    get_a = client.get(f"/api/v1/conversations/{conv_a_id}", headers=headers_a)
    assert get_a.status_code == 200
    assert get_a.json()["title"] == "Alpha Secret Conversation"

def test_conversation_lifecycle():
    create_resp = client.post("/api/v1/conversations/", json={
        "title": "Test AI Chat",
        "assistant_mode": "coding",
        "model_name": "llama-3.3-70b-versatile"
    })
    assert create_resp.status_code == 201
    conv = create_resp.json()
    conv_id = conv["id"]
    assert conv["title"] == "Test AI Chat"
    assert conv["assistant_mode"] == "coding"

    # List
    list_resp = client.get("/api/v1/conversations/")
    assert list_resp.status_code == 200
    convs = list_resp.json()
    assert any(c["id"] == conv_id for c in convs)

    # Update (pin & rename)
    update_resp = client.patch(f"/api/v1/conversations/{conv_id}", json={
        "title": "Renamed Test Chat",
        "is_pinned": True
    })
    assert update_resp.status_code == 200
    assert update_resp.json()["title"] == "Renamed Test Chat"
    assert update_resp.json()["is_pinned"] is True

    # Export Markdown
    export_md = client.get(f"/api/v1/conversations/{conv_id}/export/markdown")
    assert export_md.status_code == 200
    assert "Renamed Test Chat" in export_md.text

    # Export JSON
    export_json = client.get(f"/api/v1/conversations/{conv_id}/export/json")
    assert export_json.status_code == 200
    assert export_json.json()["id"] == conv_id

    # Delete
    del_resp = client.delete(f"/api/v1/conversations/{conv_id}")
    assert del_resp.status_code == 204

def test_safe_math_tool():
    res = tool_service.calculate("25 * 4 + 10 / 2")
    assert res["success"] is True
    assert res["result"] == 105.0

    power_res = tool_service.calculate("2 ** 5")
    assert power_res["success"] is True
    assert power_res["result"] == 32

    fail_res = tool_service.calculate("__import__('os').system('dir')")
    assert fail_res["success"] is False

def test_pure_python_bm25():
    corpus = [
        ["fastapi", "python", "backend", "web", "framework"],
        ["react", "typescript", "frontend", "ui", "components"],
        ["sql", "database", "postgresql", "sqlite", "queries"]
    ]
    engine = PurePythonBM25(corpus)
    scores = engine.score(["fastapi", "framework"])
    assert scores[0] > scores[1]
    assert scores[0] > scores[2]

def test_settings_endpoint():
    resp = client.get("/api/v1/settings/")
    assert resp.status_code == 200
    data = resp.json()
    assert "theme" in data
    assert "allowed_models" in data
    assert "qwen/qwen3.8-27b" in data["allowed_models"]

def test_document_and_rag_workflow():
    sample_txt = "Lumi AI is an advanced conversational platform built with FastAPI and React. It supports RAG and voice features."
    files = {"file": ("test_doc.txt", io.BytesIO(sample_txt.encode("utf-8")), "text/plain")}
    
    upload_resp = client.post("/api/v1/documents/upload", files=files)
    assert upload_resp.status_code == 201
    doc = upload_resp.json()
    doc_id = doc["id"]
    assert doc["filename"] == "test_doc.txt"
    assert doc["chunk_count"] > 0

    # Query RAG
    query_resp = client.post("/api/v1/documents/query", json={
        "query": "What is Lumi AI built with?",
        "document_ids": [doc_id]
    })
    assert query_resp.status_code == 200
    chunks = query_resp.json()
    assert len(chunks) > 0
    assert "FastAPI" in chunks[0]["content"]

    # Delete doc
    del_resp = client.delete(f"/api/v1/documents/{doc_id}")
    assert del_resp.status_code == 204

def test_csv_data_analysis_workflow(tmp_path):
    csv_file = tmp_path / "sales.csv"
    csv_file.write_text("region,revenue,units\nNorth,1200,10\nSouth,850,7\nEast,1400,12\nWest,950,8\nNorth,1100,9\n")

    profile = analysis_service.profile_csv(csv_file)
    assert profile.total_rows == 5
    assert profile.total_columns == 3
    assert any(c.name == "revenue" and c.dtype in ["int64", "float64"] for c in profile.columns)

    agg = analysis_service.execute_aggregation(csv_file, group_col="region", agg_col="revenue", agg_func="sum")
    assert len(agg) > 0
    assert any(r["region"] == "North" for r in agg)
