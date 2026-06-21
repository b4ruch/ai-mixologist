import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import recipes
from app.routers import auth

app = FastAPI(
    title="AI Mixologist API",
    description="Backend API for the AI Mixologist Application",
    version="1.0.0"
)

# CORS configuration for our future Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the routes
app.include_router(auth.router, prefix="/api/v1")
app.include_router(recipes.router, prefix="/api/v1")

@app.get("/health")
def health_check():
    """Simple health check endpoint for Cloud Run."""
    return {"status": "healthy", "service": "AI Mixologist API"}
