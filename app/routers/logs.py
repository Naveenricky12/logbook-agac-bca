from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas, database

router = APIRouter(
    prefix="/api/logs",
    tags=["logs"]
)

@router.post("/checkin", response_model=schemas.LogOut)
def check_in(log: schemas.LogCreate, db: Session = Depends(database.get_db)):
    # Check if student already has an active session
    active_log = crud.get_active_log_by_student(db, log.student_id)
    if active_log:
        raise HTTPException(status_code=400, detail="Student already checked in.")
    try:
        return crud.create_log(db, log)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.put("/checkout/{log_id}", response_model=schemas.LogOut)
def check_out(log_id: int, update: schemas.LogUpdate, db: Session = Depends(database.get_db)):
    db_log = crud.get_log_by_id(db, log_id)
    if not db_log:
        raise HTTPException(status_code=404, detail="Log entry not found")
    if db_log.check_out_time:
        raise HTTPException(status_code=400, detail="Already checked out")
    
    return crud.checkout_log(db, log_id, update.issues_reported)

@router.get("/active/{student_id}", response_model=schemas.LogOut)
def get_active_log(student_id: str, db: Session = Depends(database.get_db)):
    log = crud.get_active_log_by_student(db, student_id)
    if not log:
        raise HTTPException(status_code=404, detail="No active session found")
    return log
