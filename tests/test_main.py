from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db

# Setup test DB
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_create_log():
    response = client.post(
        "/api/logs/checkin",
        json={"student_name": "John Doe", "student_id": "12345", "computer_number": "PC-01", "purpose": "Research"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["student_name"] == "John Doe"
    assert "id" in data
    return data["id"]

def test_duplicate_checkin():
    # John Doe 12345 is already checked in from previous test? 
    # Actually context is fresh if we didn't clear DB but let's assume sequential execution or clean slate.
    # To be safe, use a new student
    client.post(
        "/api/logs/checkin",
        json={"student_name": "Jane Doe", "student_id": "99999", "computer_number": "PC-02", "purpose": "Assignment"},
    )
    response = client.post(
        "/api/logs/checkin",
        json={"student_name": "Jane Doe", "student_id": "99999", "computer_number": "PC-03", "purpose": "Assignment"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Student already checked in."

def test_checkout_log():
    # Check in first
    res = client.post(
        "/api/logs/checkin",
        json={"student_name": "Alice", "student_id": "55555", "computer_number": "PC-05", "purpose": "Other"},
    )
    log_id = res.json()["id"]
    
    # Check out
    response = client.put(
        f"/api/logs/checkout/{log_id}",
        json={"issues_reported": "Mouse broken"}
    )
    assert response.status_code == 200
    assert response.json()["issues_reported"] == "Mouse broken"
    assert response.json()["check_out_time"] is not None

def test_admin_logs():
    response = client.get("/api/admin/logs", auth=("admin", "password"))
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_admin_logs_unauthorized():
    response = client.get("/api/admin/logs", auth=("admin", "wrongpassword"))
    assert response.status_code == 401
