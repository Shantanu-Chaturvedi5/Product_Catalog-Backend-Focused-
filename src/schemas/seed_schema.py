from typing import Dict

from pydantic import BaseModel


class SeedInfoResponse(BaseModel):

    total_records: int

    generation_duration: float

    category_distribution: Dict[str, int]

    class Config:
        from_attributes = True