import json

from sqlalchemy.sql import text
from flask import Request, Response, abort

from .db import connection
from .net import HEADERS

fetch_image = text("SELECT id, image, votes, tournaments, descriptor, landmarks from FACES WHERE id = :id")
PREFIX = 'data:image/png;base64,'


def get_image_handler(request: Request):
    if request.method == 'OPTIONS':
        return Response('', headers=HEADERS)
    if request.method == 'GET':
        id = int(request.values.get('id'))
        rows = connection.execute(fetch_image, id=id)
        for row in rows:
            return Response(
                json.dumps(dict(row)),
                headers={
                    **HEADERS,
                }
            )
        abort(404)