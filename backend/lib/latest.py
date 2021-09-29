import os
import json
from sqlalchemy.sql import text
from flask import Request, Response

from .db import engine
from .net import HEADERS

UPDATE_KEY = os.environ.get('UPDATE_KEY')

fetch_latest_1 = text('''
    SELECT id, image, votes, tournaments, 
        votes_0, tournaments_0, 
        votes_1, tournaments_1, 
        votes_2, tournaments_2, 
        votes_3, tournaments_3, 
        votes_4, tournaments_4,
        descriptor, landmarks, gender_age, place_name, created_timestamp
    FROM faces
    where last_shown_1 is null
    ORDER BY id asc
    LIMIT 1
''')
fetch_latest_2 = text('''
    SELECT id, image, votes, tournaments, 
        votes_0, tournaments_0, 
        votes_1, tournaments_1, 
        votes_2, tournaments_2, 
        votes_3, tournaments_3, 
        votes_4, tournaments_4,
        descriptor, landmarks, gender_age, place_name, created_timestamp
    FROM faces
    where last_shown_1 is not null
    ORDER BY last_shown_1 asc
    LIMIT 1
''')
update = text('''
    UPDATE FACES set last_shown_1=now() where id=:id
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
            update_key = request.args.get('key')
            if result and update_key and UPDATE_KEY == update_key:
                connection.execute(update, id=result['id'])
        if result is not None:
            result['created_timestamp'] = result['created_timestamp'].isoformat()
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
