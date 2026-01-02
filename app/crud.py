from sqlalchemy.orm import Session
from . import models, schemas
from datetime import datetime

# Student CRUD
def get_student(db: Session, student_id: int):
    return db.query(models.Student).filter(models.Student.id == student_id).first()

def get_student_by_reg_no(db: Session, register_number: str):
    return db.query(models.Student).filter(models.Student.register_number == register_number).first()

def get_students(db: Session, skip: int = 0, limit: int = 100, year: str = None):
    query = db.query(models.Student)
    if year:
        query = query.filter(models.Student.year == year)
    return query.offset(skip).limit(limit).all()

def create_student(db: Session, student: schemas.StudentCreate):
    db_student = models.Student(
        register_number=student.register_number,
        name=student.name,
        year=student.year
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

def update_student(db: Session, student_id: int, student: schemas.StudentUpdate):
    db_student = get_student(db, student_id)
    if db_student:
        if student.name: db_student.name = student.name
        if student.year: db_student.year = student.year
        db.commit()
        db.refresh(db_student)
    return db_student

def delete_student(db: Session, student_id: int):
    # Optional but good to have
    db_student = get_student(db, student_id)
    if db_student:
        db.delete(db_student)
        db.commit()
    return db_student

# Log CRUD
def create_log(db: Session, log: schemas.LogCreate):
    # Fetch student details
    student = get_student_by_reg_no(db, log.student_id)
    if not student:
        raise ValueError("Student not found")
        
    db_log = models.LogEntry(
        student_id=log.student_id,
        student_name=student.name, # Snapshot
        year=student.year,         # Snapshot
        computer_number=log.computer_number,
        purpose=log.purpose
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

def get_logs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.LogEntry).offset(skip).limit(limit).all()

def get_log_by_id(db: Session, log_id: int):
    return db.query(models.LogEntry).filter(models.LogEntry.id == log_id).first()

def get_active_log_by_student(db: Session, student_id: str):
    return db.query(models.LogEntry).filter(
        models.LogEntry.student_id == student_id,
        models.LogEntry.check_out_time == None
    ).first()

def get_student_logs(db: Session, student_id: str):
    return db.query(models.LogEntry).filter(
        models.LogEntry.student_id == student_id,
        models.LogEntry.check_out_time != None
    ).all()

def checkout_log(db: Session, log_id: int, issues_reported: str = None):
    db_log = get_log_by_id(db, log_id)
    if db_log:
        db_log.check_out_time = models.get_ist_time()
        if issues_reported:
            db_log.issues_reported = issues_reported
        db.commit()
        db.refresh(db_log)
    return db_log

def delete_all_logs(db: Session):
    try:
        num_deleted = db.query(models.LogEntry).delete()
        db.commit()
        return num_deleted
    except Exception as e:
        db.rollback()
        raise e

def delete_logs_by_ids(db: Session, log_ids: list[int]):
    try:
        num_deleted = db.query(models.LogEntry).filter(models.LogEntry.id.in_(log_ids)).delete(synchronize_session=False)
        db.commit()
        return num_deleted
    except Exception as e:
        db.rollback()
        raise e
