import asyncio
import random
from datetime import datetime

import httpx
from faker import Faker
from sqlalchemy import insert

from src.database.session import SessionLocal
from src.models.product import Product

fake = Faker()

BASE_URL = "http://127.0.0.1:8000"


async def insert_products():

    async with SessionLocal() as db:

        products = []

        for _ in range(50):

            products.append(
                {
                    "name": fake.catch_phrase(),
                    "category": random.choice(
                        [
                            "Electronics",
                            "Books",
                            "Fashion",
                            "Sports",
                            "Toys"
                        ]
                    ),
                    "price": round(
                        random.uniform(10, 5000),
                        2
                    ),
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            )

        await db.execute(
            insert(Product),
            products
        )

        await db.commit()


async def main():

    seen = set()

    duplicates = []

    cursor = None

    async with httpx.AsyncClient() as client:

        print("Fetching first pages...")

        for _ in range(3):

            params = {"limit": 20}

            if cursor:
                params["cursor"] = cursor

            response = await client.get(
                f"{BASE_URL}/products",
                params=params
            )

            data = response.json()

            for product in data["products"]:

                if product["id"] in seen:

                    duplicates.append(
                        product["id"]
                    )

                seen.add(product["id"])

            cursor = data["next_cursor"]

        print("Inserting 50 new products...")

        await insert_products()

        print("Continuing pagination...")

        while cursor:

            response = await client.get(

                f"{BASE_URL}/products",

                params={
                    "cursor": cursor,
                    "limit": 20
                }

            )

            data = response.json()

            for product in data["products"]:

                if product["id"] in seen:

                    duplicates.append(
                        product["id"]
                    )

                seen.add(product["id"])

            if not data["has_more"]:

                break

            cursor = data["next_cursor"]

    print("\n" + "=" * 60)

    print("Concurrency Test Report")

    print("=" * 60)

    print(f"Products Visited : {len(seen)}")

    print(f"Duplicate IDs    : {len(duplicates)}")

    print(f"Duplicates Found : {duplicates}")

    print("=" * 60)


if __name__ == "__main__":

    asyncio.run(main())