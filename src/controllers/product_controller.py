from fastapi import (
    APIRouter,
    Depends,
    Query
)

from src.database.session import get_db
from src.services.product_service import ProductService
from src.schemas.pagination_schema import ProductPaginationResponse

router = APIRouter()


@router.get(
    "/products",
    response_model=ProductPaginationResponse,
    summary="Browse products",
    description="Cursor-based pagination for product catalog"
)
async def get_products(

    limit: int = Query(
        default=20,
        ge=1,
        le=100
    ),

    cursor: str | None = Query(
        default=None
    ),

    category: str | None = Query(
        default=None
    ),

    min_price: float | None = Query(
        default=None,
        ge=0
    ),

    max_price: float | None = Query(
        default=None,
        ge=0
    ),

    search: str | None = Query(
        default=None
    ),

    db=Depends(get_db)
):

    service = ProductService(db)

    return await service.browse_products(
        limit,
        cursor,
        category,
        min_price,
        max_price,
        search
    )