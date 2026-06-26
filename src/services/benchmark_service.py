import re

from sqlalchemy import text


class BenchmarkService:

    def __init__(self, db):
        self.db = db

    async def _execution_time(self, query: str) -> float:

        result = await self.db.execute(
            text(f"EXPLAIN ANALYZE {query}")
        )

        plan = result.fetchall()

        for row in plan:

            line = row[0]

            match = re.search(
                r"Execution Time: ([\d.]+) ms",
                line
            )

            if match:
                return float(match.group(1))

        return 0.0

    async def benchmark(self):

        cursor_time = await self._execution_time(
            """
            SELECT *
            FROM products
            ORDER BY updated_at DESC, id DESC
            LIMIT 50
            """
        )

        offset_time = await self._execution_time(
            """
            SELECT *
            FROM products
            ORDER BY updated_at DESC, id DESC
            LIMIT 50 OFFSET 100000
            """
        )

        improvement = 0.0

        if offset_time > 0:

            improvement = round(
                ((offset_time - cursor_time) / offset_time) * 100,
                2
            )

        return {

            "cursor_query_time_ms": cursor_time,

            "offset_query_time_ms": offset_time,

            "percentage_improvement": improvement

        }