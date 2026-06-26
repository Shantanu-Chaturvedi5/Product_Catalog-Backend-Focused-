from sqlalchemy import select

from src.models.seed_metadata import SeedMetadata


class SeedRepository:

    def __init__(self, db):
        self.db = db

    async def get_seed_info(self):

        result = await self.db.execute(
            select(SeedMetadata).order_by(
                SeedMetadata.id.desc()
            )
        )

        return result.scalars().first()