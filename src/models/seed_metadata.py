from sqlalchemy import Integer, Float, JSON
from sqlalchemy.orm import mapped_column

from src.database.base import Base


class SeedMetadata(Base):

    __tablename__ = "seed_metadata"

    id = mapped_column(
        Integer,
        primary_key=True
    )

    total_records = mapped_column(
        Integer,
        nullable=False
    )

    generation_duration = mapped_column(
        Float,
        nullable=False
    )

    category_distribution = mapped_column(
        JSON,
        nullable=False
    )