import codecs
import json
from sqlalchemy.sql import text
from flask import Request, Response

from .db import connection
from .net import HEADERS

fetch_random = text('WITH a as (SELECT * from faces ORDER BY tournaments LIMIT 100) SELECT * FROM a ORDER BY RANDOM() limit 5')
PREFIX = 'data:image/png;base64,'

def get_game_handler(request: Request):
    if request.method == 'OPTIONS':
        return Response('', headers=HEADERS)
    if request.method == 'POST':
        rows = connection.execute(fetch_random)
        result = []
        for row in rows:
            row = dict(row)
            row['image'] = PREFIX + codecs.decode(codecs.encode(row['image'], 'base64'), 'ascii')
            row['created_timestamp'] = row['created_timestamp'].isoformat()
            result.append(row)
        response = dict(
            success=True, records=result
        )
        return Response(
            json.dumps(response),
            headers=HEADERS
        )
    return json.dumps(dict(success=False))