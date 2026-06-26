from pydantic import BaseModel


class BenchmarkResponse(BaseModel):

    cursor_query_time_ms: float

    offset_query_time_ms: float

    percentage_improvement: float