"""
Lightweight pytest version of scripts/test_concurrency.py.

Verifies, via the public HTTP API, that a pagination session started before
50 concurrent inserts still sees every product that existed before those
inserts, exactly once each (no duplicates, no skips) — independent of where
the new rows land in the sort order.
"""

import random
from datetime import datetime, timezone

import pytest
from sqlalchemy import insert, select
from faker import Faker

from src.database.session import SessionLocal
from src.models.product import Product

fake = Faker()


async def _insert_random_products(count: int):

    async with SessionLocal() as db:

        rows = [
            {
                "name": fake.catch_phrase(),
                "category": random.choice(
                    ["Electronics", "Books", "Fashion", "Sports", "Toys"]
                ),
                "price": round(random.uniform(10, 5000), 2),
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            for _ in range(count)
        ]

        await db.execute(insert(Product), rows)
        await db.commit()


async def _all_product_ids():

    async with SessionLocal() as db:
        result = await db.execute(select(Product.id))
        return {str(row[0]) for row in result.all()}


@pytest.mark.asyncio
async def test_pagination_stable_under_concurrent_inserts(client):

    # Snapshot every product that exists BEFORE we start paging, so we can
    # later assert none of them were skipped -- this is the check the
    # original script was missing.
    pre_existing_ids = await _all_product_ids()

    seen = set()
    duplicates = []
    cursor = None
    pages_fetched = 0

    # Page through the first few pages before the concurrent write happens.
    for _ in range(3):

        params = {"limit": 20}
        if cursor:
            params["cursor"] = cursor

        response = client.get("/products", params=params)
        assert response.status_code == 200

        data = response.json()

        for product in data["products"]:
            if product["id"] in seen:
                duplicates.append(product["id"])
            seen.add(product["id"])

        pages_fetched += 1
        cursor = data["next_cursor"]

        if not data["has_more"]:
            break

    # Concurrent write: 50 new products inserted mid-pagination.
    await _insert_random_products(50)

    # Continue the SAME cursor chain to the end.
    while cursor:

        response = client.get(
            "/products", params={"cursor": cursor, "limit": 20}
        )
        assert response.status_code == 200

        data = response.json()

        for product in data["products"]:
            if product["id"] in seen:
                duplicates.append(product["id"])
            seen.add(product["id"])

        if not data["has_more"]:
            break

        cursor = data["next_cursor"]

    # No duplicates anywhere in the session.
    assert duplicates == [], f"Duplicate product IDs returned: {duplicates}"

    # No pre-existing product was skipped because of the concurrent insert.
    missing = pre_existing_ids - seen
    assert missing == set(), f"Products missing from pagination: {missing}"