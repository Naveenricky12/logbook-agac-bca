from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from sqlalchemy.orm import Session
from .. import crud, schemas, database
import csv
import io
from fastapi.responses import StreamingResponse

router = APIRouter(
    prefix="/api/admin",
    tags=["admin"]
)

security = HTTPBasic()

def get_current_admin(credentials: HTTPBasicCredentials = Depends(security)):
    if credentials.username != "admin" or credentials.password != "password":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

@router.post("/login")
def login(admin: str = Depends(get_current_admin)):
    return {"message": "Login successful"}

@router.get("/logs", response_model=list[schemas.LogOut])
def list_logs(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(database.get_db),
    admin: str = Depends(get_current_admin)
):
    return crud.get_logs(db, skip=skip, limit=limit)

@router.get("/export")
def export_logs(
    db: Session = Depends(database.get_db),
    admin: str = Depends(get_current_admin)
):
    logs = crud.get_logs(db, limit=10000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Register Number", "Name", "Year", "Computer", "Subject", "Check-in", "Check-out", "Issues"])
    
    for log in logs:
        writer.writerow([
            log.id, 
            log.student_id, 
            log.student_name, 
            log.year,
            log.computer_number, 
            log.purpose, 
            log.check_in_time, 
            log.check_out_time, 
            log.issues_reported
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=logs.csv"}
    )
