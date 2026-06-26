import time
import logging

from src.middleware.request_id import (
    set_request_id,
    get_request_id,
    reset_db_time,
    get_db_time
)

import uuid

logger = logging.getLogger()


async def logging_middleware(
    request,
    call_next
):

    request_id = str(
        uuid.uuid4()
    )

    set_request_id(request_id)
    reset_db_time()

    start = time.perf_counter()

    response = await call_next(
        request
    )

    latency = (
        time.perf_counter() - start
    ) * 1000

    logger.info(
        {
            "request_id": get_request_id(),
            "endpoint": request.url.path,
            "latency_ms": latency,
            "status_code": response.status_code,
            "database_time_ms": get_db_time()
        }
    )

    response.headers["X-Request-ID"] = request_id

    return response