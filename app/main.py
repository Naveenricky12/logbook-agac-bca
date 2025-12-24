from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from . import models, database
from .routers import logs, admin, students

models.Base.metadata.create_all(bind=database.engine)

import os

# ... imports ...

app = FastAPI(title="Library Log Book")

# Get absolute path to the 'app' directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Mount static files correctly
app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")

# Mount templates correctly
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

app.include_router(logs.router)
app.include_router(admin.router)
app.include_router(students.router)

@app.get("/")
def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/login")
def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/dashboard")
def dashboard_page(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})
