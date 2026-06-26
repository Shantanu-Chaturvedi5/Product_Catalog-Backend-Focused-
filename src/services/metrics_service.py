from src.middleware.metrics import metrics

from src.repositories.metrics_repository import (
    MetricsRepository
)


class MetricsService:

    def __init__(self, db):

        self.repository = MetricsRepository(db)

    async def get_metrics(self):

        total = await self.repository.total_products()

        avg_response = 0

        if metrics.total_requests:

            avg_response = (

                metrics.total_response_time
                /
                metrics.total_requests

            )

        avg_pagination = 0

        if metrics.total_requests:

            avg_pagination = (

                metrics.total_pagination_time
                /
                metrics.total_requests

            )

        avg_db = 0

        if metrics.total_requests:

            avg_db = (

                metrics.total_database_time
                /
                metrics.total_requests

            )

        return {

            "total_products": total,

            "average_response_time_ms": round(
                avg_response,
                2
            ),

            "average_pagination_time_ms": round(
                avg_pagination,
                2
            ),

            "database_query_time_ms": round(
                avg_db,
                2
            )

        }