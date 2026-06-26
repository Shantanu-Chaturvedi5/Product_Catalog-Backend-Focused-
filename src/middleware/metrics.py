import time


class MetricsStore:

    total_requests = 0

    total_response_time = 0.0

    total_pagination_time = 0.0

    total_database_time = 0.0


metrics = MetricsStore()


class MetricsMiddleware:

    def __init__(self, app):

        self.app = app

    async def __call__(
        self,
        scope,
        receive,
        send
    ):

        if scope["type"] != "http":

            await self.app(
                scope,
                receive,
                send
            )

            return

        start = time.perf_counter()

        await self.app(
            scope,
            receive,
            send
        )

        elapsed = (
            time.perf_counter()
            - start
        ) * 1000

        metrics.total_requests += 1

        metrics.total_response_time += elapsed