from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.middleware.metrics import MetricsMiddleware
from src.middleware.exception_handler import register_exception_handlers
from src.controllers.product_controller import (
    router as product_router
)

from src.controllers.seed_controller import (
    router as seed_router
)

from src.controllers.metrics_controller import (
    router as metrics_router
)

from src.controllers.benchmark_controller import (
    router as benchmark_router
)

from src.middleware.logging_middleware import (
    logging_middleware
)

app = FastAPI(
    title="Product Catalog API",
    description="Cursor Pagination Backend",
    version="1.0.0"
)
register_exception_handlers(app)
# CORS
app.add_middleware(
    MetricsMiddleware
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Logging Middleware

app.middleware("http")(
    logging_middleware
)

# Routers

app.include_router(
    product_router,
    tags=["Products"]
)

app.include_router(
    seed_router,
    tags=["Seed"]
)

app.include_router(
    metrics_router,
    tags=["Metrics"]
)

app.include_router(
    benchmark_router,
    tags=["Benchmarks"]
)

# Health Check

@app.get("/health")
async def health():

    return {
        "status": "healthy"
    }