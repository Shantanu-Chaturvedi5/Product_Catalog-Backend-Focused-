from datetime import datetime, timezone
from uuid import uuid4

from src.utils.cursor import (
    encode_cursor,
    decode_cursor
)


def test_cursor_roundtrip():

    some_time = datetime.now(timezone.utc)
    some_uuid = uuid4()

    encoded = encode_cursor(
        some_time,
        some_uuid
    )

    decoded = decode_cursor(
        encoded
    )

    assert decoded["id"] == some_uuid
    assert decoded["updated_at"] == some_time


def test_cursor_is_base64_string():

    encoded = encode_cursor(
        datetime.now(timezone.utc),
        uuid4()
    )

    assert isinstance(encoded, str)

    import base64
    # Should decode without raising
    base64.b64decode(encoded)