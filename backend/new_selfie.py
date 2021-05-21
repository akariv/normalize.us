import codecs
import json
from sqlalchemy.sql import text
from flask import Request, Response

from .db import connection
from .net import HEADERS

insert_new = text('INSERT INTO FACES (image, descriptor) VALUES (:image, :descriptor) RETURNING id')
PREFIX = 'data:image/png;base64,'

def new_selfie_handler(request: Request):
    if request.method == 'OPTIONS':
        return Response('', headers=HEADERS)
    if request.method == 'POST':
        content = request.json
        image = content['image']
        if image.startswith(PREFIX):
            image = image[len(PREFIX):]
            hexstr = codecs.encode(codecs.decode(image.strip().encode('ascii'), 'base64'), 'hex').decode('ascii')
            hexstr = r'\x' + hexstr

            descriptor = content.get('descriptor')
            descriptor = json.dumps(descriptor)

            result = connection.execute(insert_new, image=hexstr, descriptor=descriptor)
            new_id = result.fetchone()[0]
            return Response(
                json.dumps(dict(success=True, id=new_id)),
                headers=HEADERS
            )
    return json.dumps(dict(success=False))
