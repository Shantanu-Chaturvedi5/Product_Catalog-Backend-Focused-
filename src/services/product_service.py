from src.utils.cursor import (
    encode_cursor,
    decode_cursor
)

from src.repositories.product_repository import (
    ProductRepository
)


class ProductService:

    def __init__(self, db):

        self.repo = ProductRepository(db)

    async def browse_products(
        self,
        limit,
        cursor,
        category,
        min_price,
        max_price,
        search
    ):

        cursor_data = None

        if cursor:
            cursor_data = decode_cursor(cursor)

        rows = await self.repo.get_products(
            limit,
            category,
            min_price,
            max_price,
            search,
            cursor_data
        )

        has_more = len(rows) > limit

        if has_more:
            rows = rows[:-1]

        next_cursor = None

        if rows:

            last = rows[-1]

            next_cursor = encode_cursor(
                last.updated_at,
                last.id
            )

        return {
            "products": rows,
            "next_cursor": next_cursor,
            "has_more": has_more
        }