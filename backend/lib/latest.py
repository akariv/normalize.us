import json
from sqlalchemy.sql import text
from flask import Request, Response

from .db import engine
from .net import HEADERS

fetch_latest = text('''
    SELECT id, image, votes, tournaments, descriptor, landmarks, gender_age
    FROM faces
    ORDER BY id desc
    LIMIT 5
''')


def get_latest_handler(request: Request):
    if request.method == 'OPTIONS':
        return Response('', headers=HEADERS)
    if request.method == 'GET':
        with engine.connect() as connection:
            rows = connection.execute(fetch_latest)
            result = []
            for row in rows:
                row = dict(row)
                result.append(row)
        response = dict(
            success=True, records=result
        )
        response = Response(
            json.dumps(response),
            headers=HEADERS
        )
        response.cache_control.max_age = 10
        return response

    return Response(
        json.dumps(dict(success=False)),
        headers=HEADERS
    )
