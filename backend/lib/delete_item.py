import json

from sqlalchemy.sql import text
from flask import Request, Response, abort

from .db import engine
from .net import HEADERS

fetch_item = text('''SELECT magic from FACES WHERE id = :id''')
delete_item = text('''UPDATE FACES set allowed=-1 WHERE id = :id''')


def delete_item_handler(request: Request):
    if request.method == 'OPTIONS':
        return Response('', headers=HEADERS)
    if request.method == 'POST':
        id = int(request.values.get('id'))
        magic = request.values.get('magic')
        with engine.connect() as connection:
            rows = connection.execute(fetch_item, id=id)
            for row in rows:
                row = dict(row)
                if row['magic'] == magic:
                    connection.execute(delete_item, id=id)
                    ret = dict(success=True)
                    return Response(
                        json.dumps(ret),
                        headers={
                            **HEADERS,
                        }
                    )
        ret = dict(success=False)
        return Response(
            json.dumps(ret),
            headers={
                **HEADERS,
            }
        )
