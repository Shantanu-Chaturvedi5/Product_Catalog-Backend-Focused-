import uuid

from sqlalchemy import (
    String,
    Numeric,
    DateTime,
    func,
    Index
)

from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import mapped_column

from src.database.base import Base


class Product(Base):

    __tablename__ = "products"

    __table_args__ = (
        Index(
            "idx_products_cursor",
            "updated_at",
            "id"
        ),
        Index(
            "idx_products_category",
            "category"
        ),
        Index(
            "idx_products_price",
            "price"
        ),
    )

    id = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    name = mapped_column(
        String(255),
        nullable=False
    )

    category = mapped_column(
        String(100),
        nullable=False
    )

    price = mapped_column(
        Numeric(10, 2),
        nullable=False
    )

    created_at = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    updated_at = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )