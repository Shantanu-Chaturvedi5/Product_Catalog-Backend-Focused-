from pydantic import BaseModel


class MetricsResponse(BaseModel):

    total_products: int

    average_response_time_ms: float

    average_pagination_time_ms: float

    database_query_time_ms: float