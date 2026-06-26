from uuid import UUID

from datetime import datetime

from pydantic import BaseModel
from decimal import Decimal

class ProductResponse(BaseModel):

    id: UUID

    name: str

    category: str

    price: Decimal

    created_at: datetime

    updated_at: datetime

    class Config:
        from_attributes = True