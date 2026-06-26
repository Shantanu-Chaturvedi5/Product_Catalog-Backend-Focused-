"""Shared pytest fixtures.

`client` gives tests a synchronous TestClient against the real FastAPI app.
This hits the real DATABASE_URL from .env — these tests are integration tests
against a running, seeded Postgres instance, not unit tests with a mocked DB.
Run them against the docker-compose `db` service (or any disposable Postgres),
never against a database whose data you care about, since test_filters.py /
test_concurrency.py assume specific seeded categories and will insert rows.
"""

import pytest
from fastapi.testclient import TestClient

from src.main import app


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client