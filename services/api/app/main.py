from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .bootstrap import bootstrap_repo_paths

bootstrap_repo_paths()

from .routes.projects import router as projects_router  # noqa: E402


app = FastAPI(
    title="Research Lineage API",
    version="0.1.0",
    description="Mock-first backend for the Research Lineage Agent MVP.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
def healthz() -> dict[str, bool]:
    return {"ok": True}


app.include_router(projects_router)
