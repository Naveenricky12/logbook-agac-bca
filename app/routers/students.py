from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from .. import crud, schemas, database
from .admin import get_current_admin
import csv
import io

router = APIRouter(
    prefix="/api/students",
    tags=["students"]
)

@router.post("/import")
async def import_students(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    admin: str = Depends(get_current_admin)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV.")
    
    content = await file.read()
    try:
        decoded_content = content.decode("utf-8")
        reader = csv.DictReader(io.StringIO(decoded_content))
        
        # Verify headers
        required_headers = {'register_number', 'name', 'year'}
        if not reader.fieldnames or not required_headers.issubset(set(reader.fieldnames)):
            raise HTTPException(status_code=400, detail=f"Invalid headers. Required: {required_headers}")
        
        count = 0
        errors = []
        
        for row in reader:
            try:
                # Basic validation
                reg_no = row.get('register_number', '').strip()
                name = row.get('name', '').strip()
                year = row.get('year', '').strip()
                
                if not reg_no or not name:
                    continue
                    
                # Schema validation (optional, allows strict checking)
                student_data = schemas.StudentCreate(
                    register_number=reg_no,
                    name=name,
                    year=year
                )
                
                # Check exist
                existing = crud.get_student_by_reg_no(db, reg_no)
                if not existing:
                    crud.create_student(db, student_data)
                    count += 1
                else:
                    # Optional: Update existing? For now, skip.
                    pass
                    
            except Exception as e:
                errors.append(f"Row error ({row}): {str(e)}")
                
        return {"message": f"Successfully imported {count} students", "errors": errors}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")

@router.get("/template")
def get_student_template(admin: str = Depends(get_current_admin)):
    # Create a simple CSV template
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['register_number', 'name', 'year'])
    writer.writerow(['21CS101', 'John Doe', '1st Year'])
    writer.writerow(['21CS102', 'Jane Smith', '2nd Year'])
    
    output.seek(0)
    
    from fastapi.responses import StreamingResponse
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=student_import_template.csv"}
    )

@router.post("/", response_model=schemas.StudentOut)
def create_student(
    student: schemas.StudentCreate, 
    db: Session = Depends(database.get_db),
    admin: str = Depends(get_current_admin)
):
    db_student = crud.get_student_by_reg_no(db, register_number=student.register_number)
    if db_student:
        raise HTTPException(status_code=400, detail="Student already registered")
    return crud.create_student(db=db, student=student)

@router.get("/", response_model=list[schemas.StudentOut])
def read_students(
    skip: int = 0, 
    limit: int = 100, 
    year: str = None,
    db: Session = Depends(database.get_db),
    admin: str = Depends(get_current_admin)
):
    return crud.get_students(db, skip=skip, limit=limit, year=year)

@router.get("/{register_number}", response_model=schemas.StudentOut)
def read_student_by_reg(register_number: str, db: Session = Depends(database.get_db)):
    db_student = crud.get_student_by_reg_no(db, register_number=register_number)
    if db_student:
        return db_student
    # This endpoint is public for the check-in form. 
    # Return 404 if not found so frontend can alert user.
    raise HTTPException(status_code=404, detail="Student not found")

@router.put("/{student_id}", response_model=schemas.StudentOut)
def update_student(
    student_id: int, 
    student: schemas.StudentUpdate, 
    db: Session = Depends(database.get_db),
    admin: str = Depends(get_current_admin)
):
    db_student = crud.update_student(db, student_id, student)
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    return db_student

@router.delete("/{student_id}")
def delete_student(
    student_id: int, 
    db: Session = Depends(database.get_db),
    admin: str = Depends(get_current_admin)
):
    db_student = crud.delete_student(db, student_id)
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"message": "Student deleted successfully"}

@router.get("/{register_number}/stats")
def get_student_stats(
    register_number: str, 
    db: Session = Depends(database.get_db),
    admin: str = Depends(get_current_admin)
):
    logs = crud.get_student_logs(db, register_number)
    
    total_seconds = 0
    subject_stats = {}
    
    for log in logs:
        if log.check_in_time and log.check_out_time:
            duration = (log.check_out_time - log.check_in_time).total_seconds()
            total_seconds += duration
            
            subject = log.purpose or "Unknown"
            if subject not in subject_stats:
                subject_stats[subject] = 0
            subject_stats[subject] += duration
            
    # Convert seconds to hours (rounded to 2 decimal places)
    total_hours = round(total_seconds / 3600, 2)
    subject_hours = {sub: round(sec / 3600, 2) for sub, sec in subject_stats.items()}
    
    return {
        "register_number": register_number,
        "total_hours": total_hours,
        "subject_breakdown": subject_hours
    }
