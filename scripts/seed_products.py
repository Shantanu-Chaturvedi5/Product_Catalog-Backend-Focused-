import asyncio
import random
import time
from datetime import timedelta

from faker import Faker
from sqlalchemy import insert

from src.database.session import SessionLocal
from src.models.product import Product
from src.models.seed_metadata import SeedMetadata

fake = Faker()

TOTAL_PRODUCTS = 200000
BATCH_SIZE = 5000

CATEGORIES = [
    "Electronics",
    "Books",
    "Fashion",
    "Sports",
    "Toys"
]


async def seed():

    start = time.perf_counter()

    async with SessionLocal() as db:

        try:

            # Delete previous data (repeatable seed)
            await db.execute(Product.__table__.delete())
            await db.execute(SeedMetadata.__table__.delete())
            await db.commit()

            inserted = 0

            category_distribution = {}

            while inserted < TOTAL_PRODUCTS:

                batch = []

                current_batch_size = min(
                    BATCH_SIZE,
                    TOTAL_PRODUCTS - inserted
                )

                for _ in range(current_batch_size):

                    category = random.choice(CATEGORIES)

                    category_distribution[category] = (
                        category_distribution.get(category, 0) + 1
                    )

                    created = fake.date_time_this_year()

                    updated = created + timedelta(
                        days=random.randint(0, 90)
                    )

                    batch.append(
                        {
                            "name": fake.catch_phrase(),
                            "category": category,
                            "price": round(
                                random.uniform(1, 5000),
                                2
                            ),
                            "created_at": created,
                            "updated_at": updated
                        }
                    )

                await db.execute(
                    insert(Product),
                    batch
                )

                await db.commit()

                inserted += current_batch_size

                print(
                    f"Inserted {inserted:,}/{TOTAL_PRODUCTS:,} products..."
                )

            duration = round(
                time.perf_counter() - start,
                2
            )

            await db.execute(
                insert(SeedMetadata).values(
                    total_records=TOTAL_PRODUCTS,
                    generation_duration=duration,
                    category_distribution=category_distribution
                )
            )

            await db.commit()

            print("\n" + "=" * 60)
            print("✅ Product seeding completed successfully")
            print(f"Total Products      : {TOTAL_PRODUCTS:,}")
            print(f"Generation Time     : {duration} seconds")
            print("Category Distribution:")

            for category, count in category_distribution.items():
                print(f"  {category:<15}: {count:,}")

            print("=" * 60)

        except Exception as e:

            await db.rollback()

            print("\n❌ Seeding Failed")
            print(str(e))

            raise


if __name__ == "__main__":
    asyncio.run(seed())