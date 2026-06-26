from fastapi import APIRouter, Depends

from src.database.session import get_db
from src.services.seed_service import SeedService

router = APIRouter()

@router.get("/seed-info")
async def seed_info(
    db=Depends(get_db)
):
    service = SeedService(db)

    return await service.get_seed_info()