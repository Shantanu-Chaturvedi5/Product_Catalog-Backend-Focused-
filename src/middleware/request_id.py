from contextvars import ContextVar

request_id_ctx: ContextVar[str | None] = ContextVar(
    "request_id",
    default=None
)

db_time_ctx: ContextVar[float] = ContextVar(
    "db_time",
    default=0.0
)


def set_request_id(request_id: str):
    request_id_ctx.set(request_id)


def get_request_id() -> str | None:
    return request_id_ctx.get()


def add_db_time(ms: float):
    db_time_ctx.set(
        db_time_ctx.get() + ms
    )


def get_db_time() -> float:
    return db_time_ctx.get()


def reset_db_time():
    db_time_ctx.set(0.0)