from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime, timedelta, timezone
from .database import Base

def get_ist_time():
    return datetime.now(timezone(timedelta(hours=5, minutes=30)))


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    register_number = Column(String, unique=True, index=True)
    name = Column(String)
    year = Column(String)

class LogEntry(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    student_name = Column(String, index=True)
    student_id = Column(String, index=True) # This matches register_number
    computer_number = Column(String)
    purpose = Column(String) # Used for Subject
    year = Column(String) # Snapshot of year
    check_in_time = Column(DateTime, default=get_ist_time)
    check_out_time = Column(DateTime, nullable=True)
    issues_reported = Column(String, nullable=True)
