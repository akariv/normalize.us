import json

from sqlalchemy.sql import text
from flask import Request, Response, abort

from .db import engine
from .net import HEADERS

fetch_image = text('''SELECT
    id, image, votes, tournaments, 
    votes_0, tournaments_0, 
    votes_1, tournaments_1, 
    votes_2, tournaments_2, 
    votes_3, tournaments_3, 
    votes_4, tournaments_4,
    descriptor, landmarks, gender_age, geolocation, created_timestamp from FACES WHERE id = :id''')


def get_image_handler(request: Request):
    if request.method == 'OPTIONS':
        return Response('', headers=HEADERS)
    if request.method == 'GET':
        id = int(request.values.get('id'))
        with engine.connect() as connection:
            rows = connection.execute(fetch_image, id=id)
            for row in rows:
                row['created_timestamp'] = row['created_timestamp'].isoformat()
                return Response(
                    json.dumps(dict(row)),
                    headers={
                        **HEADERS,
                    }
                )
        abort(404)