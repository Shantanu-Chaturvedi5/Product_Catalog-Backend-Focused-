import re

from sqlalchemy import text


class BenchmarkRepository:

    def __init__(self, db):
        self.db = db

    async def _extract_execution_time(self, plan):

        """
        Extract execution time (ms) from EXPLAIN ANALYZE output.
        """

        for row in plan:

            line = row[0]

            match = re.search(
                r"Execution Time: ([\d.]+) ms",
                line
            )

            if match:
                return float(match.group(1))

        return 0.0

    async def benchmark_cursor(self):

        result = await self.db.execute(

            text("""
            EXPLAIN ANALYZE
            SELECT *
            FROM products
            ORDER BY updated_at DESC, id DESC
            LIMIT 20
            """)

        )

        return await self._extract_execution_time(
            result.fetchall()
        )

    async def benchmark_offset(self):

        result = await self.db.execute(

            text("""
            EXPLAIN ANALYZE
            SELECT *
            FROM products
            ORDER BY updated_at DESC, id DESC
            LIMIT 20 OFFSET 100000
            """)

        )

        return await self._extract_execution_time(
            result.fetchall()
        )