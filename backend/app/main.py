import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.database.base import Base
from app.database.session import engine, SessionLocal
from app.models.user import User
from app.core.security import get_password_hash
from app.api.v1.router import api_router

# Create database tables if they do not exist
Base.metadata.create_all(bind=engine)

# Auto-seed default admin user if missing
try:
    with SessionLocal() as db:
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                username="admin",
                password_hash=get_password_hash("admin123"),
                full_name="CSI Committee Admin",
                email="admin@csi-catt.org",
                role="ADMIN"
            )
            db.add(admin_user)
            db.commit()
            print("[INFO] Auto-seeded default admin user ('admin' / 'admin123')")
except Exception as e:
    print(f"[WARNING] Auto-seed admin error: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS setup
cors_origins = list(settings.BACKEND_CORS_ORIGINS) if isinstance(settings.BACKEND_CORS_ORIGINS, list) else []
if settings.FRONTEND_URL and settings.FRONTEND_URL.strip():
    clean_frontend = settings.FRONTEND_URL.strip().rstrip("/")
    if clean_frontend not in cors_origins:
        cors_origins.append(clean_frontend)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if cors_origins else ["*"],
    allow_origin_regex=r"https://.*\.onrender\.com|https://.*\.vercel\.app" if not cors_origins else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"An unexpected internal error occurred: {str(exc)}"}
    )


@app.get("/")
def root_status():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs"
    }


# Include API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Optional Static Files & SPA Fallback for Single Service Render Deployments
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend_dist")
if not os.path.exists(frontend_dist):
    # Check fallback path relative to project root
    frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend", "dist")

if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("redoc"):
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return JSONResponse(status_code=404, content={"detail": "Not Found"})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

