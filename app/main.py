from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from . import models, database
from .routers import logs, admin, students

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Library Log Book")

app.mount("/static", StaticFiles(directory="c:/LOGBOOK/app/static"), name="static")

templates = Jinja2Templates(directory="c:/LOGBOOK/app/templates")

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
