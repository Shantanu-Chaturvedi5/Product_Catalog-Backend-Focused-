from fastapi import APIRouter, Depends

from src.database.session import get_db

from src.schemas.metrics_schema import MetricsResponse

from src.services.metrics_service import MetricsService

router = APIRouter()


@router.get(
    "/metrics",
    response_model=MetricsResponse,
    tags=["Metrics"]
)
async def metrics_endpoint(
    db=Depends(get_db)
):

    service = MetricsService(db)

    return await service.get_metrics()