from sqlalchemy import select, tuple_

from src.models.product import Product


class ProductRepository:

    def __init__(self, db):
        self.db = db


    async def get_products(
        self,
        limit,
        category,
        min_price,
        max_price,
        search,
        cursor_data
    ):

        query = select(Product)

        if category:
            query = query.where(
                Product.category == category
            )

        if min_price is not None:
            query = query.where(
                Product.price >= min_price
            )

        if max_price:
            query = query.where(
                Product.price <= max_price
            )

        if search:
            query = query.where(
                Product.name.ilike(
                    f"%{search}%"
                )
            )

        if cursor_data:

            query = query.where(
                tuple_(
                    Product.updated_at,
                    Product.id
                ) <
                (
                    cursor_data["updated_at"],
                    cursor_data["id"]
                )
            )

        query = query.order_by(
            Product.updated_at.desc(),
            Product.id.desc()
        )

        query = query.limit(limit + 1)

        result = await self.db.execute(query)

        return result.scalars().all()