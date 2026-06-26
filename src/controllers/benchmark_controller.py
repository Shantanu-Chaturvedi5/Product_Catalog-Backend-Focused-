from fastapi import APIRouter, Depends

from src.database.session import get_db

from src.schemas.benchmark_schema import BenchmarkResponse

from src.services.benchmark_service import BenchmarkService

router = APIRouter()


@router.get(
    "/benchmarks",
    response_model=BenchmarkResponse,
    tags=["Benchmarks"]
)
async def benchmarks(
    db=Depends(get_db)
):

    service = BenchmarkService(db)

    return await service.benchmark()