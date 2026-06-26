from sqlalchemy import func, select

from src.models.product import Product


class MetricsRepository:

    def __init__(self, db):

        self.db = db

    async def total_products(self):

        result = await self.db.execute(

            select(
                func.count(Product.id)
            )

        )

        return result.scalar()