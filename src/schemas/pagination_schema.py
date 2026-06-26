from typing import List

from pydantic import BaseModel

from .product_schema import ProductResponse


class ProductPaginationResponse(BaseModel):

    products: List[ProductResponse]

    next_cursor: str | None

    has_more: bool