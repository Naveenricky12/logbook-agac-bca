from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Student Schemas
class StudentBase(BaseModel):
    register_number: str
    name: str
    year: str

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    year: Optional[str] = None

class StudentOut(StudentBase):
    id: int

    class Config:
        orm_mode = True

# Log Schemas
class LogBase(BaseModel):
    student_id: str
    computer_number: str
    purpose: str # Subject

class LogCreate(LogBase):
    # Name and Year are fetched from DB backend-side or passed if we want to trust frontend (plan said fetch)
    # Actually, for the API, it's safer if frontend sends just ID and backend fetching, BUT
    # providing name/year in Create might be useful for snapshotting. 
    # Let's stick to: Frontend sends ID, Computer, Subject. Backend looks up Name/Year.
    # Wait, if backend looks up, we don't need them in LogCreate?
    # Actually, let's allow them to be passed optionally or handled in CRUD.
    # Let's keep LogCreate minimal as per new flow.
    pass

class LogUpdate(BaseModel):
    issues_reported: Optional[str] = None

class LogOut(LogBase):
    id: int
    student_name: str
    year: Optional[str] = None
    check_in_time: datetime
    check_out_time: Optional[datetime] = None
    issues_reported: Optional[str] = None

    class Config:
        orm_mode = True
