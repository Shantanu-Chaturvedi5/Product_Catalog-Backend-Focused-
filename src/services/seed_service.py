from src.repositories.seed_repository import SeedRepository

class SeedService:

    def __init__(self, db):
        self.repo = SeedRepository(db)

    async def get_seed_info(self):

        return await self.repo.get_seed_info()