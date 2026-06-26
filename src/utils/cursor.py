import json
import base64

from datetime import datetime
from uuid import UUID


def encode_cursor(updated_at, product_id):

    payload = {
        "updated_at": updated_at.isoformat(),
        "id": str(product_id)
    }

    return base64.b64encode(
        json.dumps(payload).encode()
    ).decode()


def decode_cursor(cursor):

    decoded = json.loads(
        base64.b64decode(cursor)
    )

    return {
        "updated_at": datetime.fromisoformat(
            decoded["updated_at"]
        ),
        "id": UUID(
            decoded["id"]
        )
    }