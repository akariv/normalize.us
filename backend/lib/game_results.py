import json
from sqlalchemy.sql import text
from flask import Request, Response

from .db import connection
from .net import HEADERS

update = text('UPDATE FACES SET tournaments = tournaments + :t SET votes = votes + :v WHERE id=:id')

def game_results_handler(request: Request):
    if request.method == 'OPTIONS':
        return Response('', headers=HEADERS)
    if request.method == 'POST':
        content = request.json
        results = content['results']
        updates = dict()
        for item in results:
            winner, loser = tuple(item)
            updates.setdefault(winner, dict(t=0, v=0))['t'] += 1
            updates.setdefault(loser, dict(t=0, v=0))['t'] += 1
            updates[winner]['v'] += 1
        for id, update in updates.items():
            connection.execute(update, t=update['t'], v=update['v'], id=id)
        response = dict(
            success=True, updated=len(updates)
        )
        return Response(
            json.dumps(response),
            headers=HEADERS
        )
    return Response(
        json.dumps(dict(success=False)),
        headers=HEADERS
    )