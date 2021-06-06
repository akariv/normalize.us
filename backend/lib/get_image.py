import codecs
import json
from sqlalchemy.sql import text
from flask import Request, Response
from PIL import Image
from io import BytesIO

from .db import connection
from .net import HEADERS

fetch_image = text("SELECT encode(image, 'base64') as image from FACES WHERE id = :id")
fetch_face_img = text("SELECT image as image from FACES WHERE id = :id")
PREFIX = 'data:image/png;base64,'


def get_image_handler(request: Request):
    if request.method == 'OPTIONS':
        return Response('', headers=HEADERS)
    if request.method == 'GET':
        id = int(request.values.get('id'))
        face = request.values.get('face_img')
        if face:
            rows = connection.execute(fetch_face_img, id=id)
            for row in rows:
                img_data = bytes(row[0])
                img = Image.open(BytesIO(img_data))
                img = img.crop((1200, 0, 1500, 300))
                out = BytesIO()
                img.save(out, format='png')
                out.seek(0)
                return Response(
                    out.read(),
                    headers={
                        **HEADERS,
                        'Content-Type': 'image/png'
                    }
                )
        else:
            rows = connection.execute(fetch_image, id=id)
            for row in rows:
                image = PREFIX + row['image']
                return Response(
                    image,
                    headers=HEADERS
                )
    return Response(
        '',
        headers=HEADERS
    )