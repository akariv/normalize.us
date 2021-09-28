import json
from sqlalchemy.sql import text
from flask import Request, Response

from .db import engine
from .net import HEADERS

fetch_latest_1 = text('''
    SELECT id, image, votes, tournaments, descriptor, landmarks, gender_age,  geolocation
    FROM faces
    where last_shown_1 is null
    ORDER BY id asc
    LIMIT 1
''')
fetch_latest_2 = text('''
    SELECT id, image, votes, tournaments, descriptor, landmarks, gender_age,  geolocation
    FROM faces
    where last_shown_1 is not null
    ORDER BY last_shown_1 asc
    LIMIT 1
''')


def get_latest_handler(request: Request):
    if request.method == 'OPTIONS':
        return Response('', headers=HEADERS)
    if request.method == 'GET':
        with engine.connect() as connection:
            rows = connection.execute(fetch_latest_1)
            result = None
            for row in rows:
                row = dict(row)
                result = row
                break
            if result is None:
                rows = connection.execute(fetch_latest_2)
                for row in rows:
                    row = dict(row)
                    result = row
                    break
        response = dict(
            success=result is not None, record=result
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
