import codecs
import json
from sqlalchemy.sql import text
from flask import Request, Response
from PIL import Image
from io import BytesIO
import uuid

from .db import connection
from .net import HEADERS, upload_fileobj_s3

insert_new = text('INSERT INTO FACES (image, descriptor, landmarks, gender_age, magic) VALUES (:image, :descriptor, :landmarks, :gender_age, :magic) RETURNING id')
PREFIX = 'data:image/png;base64,'

def new_selfie_handler(request: Request):
    if request.method == 'OPTIONS':
        return Response('', headers=HEADERS)
    if request.method == 'POST':
        content = request.json
        image = content['image']
        if image.startswith(PREFIX):
            image = image[len(PREFIX):]
            image = codecs.decode(image.strip().encode('ascii'), 'base64')
            filename_base = uuid.uuid4().hex
            magic = uuid.uuid4().hex

            face = Image.open(BytesIO(image))
            full_image = BytesIO()
            face.save(full_image, format='png', optimize=True)
            full_image.seek(0)
            assert upload_fileobj_s3(full_image, 'photos/' + filename_base + '_full.png', 'image/png')

            face = face.crop((1200, 0, 1500, 300))
            face_image = BytesIO()
            face.save(face_image, format='png', optimize=True)
            face_image.seek(0)
            assert upload_fileobj_s3(face_image, 'photos/' + filename_base + '_face.png', 'image/png')

            descriptor = content.get('descriptor')
            descriptor = json.dumps(descriptor)

            landmarks = content.get('landmarks')
            landmarks = json.dumps(landmarks)

            gender_age = content.get('gender_age')
            gender_age = json.dumps(gender_age)

            result = connection.execute(insert_new, image=filename_base, descriptor=descriptor, landmarks=landmarks, gender_age=gender_age, magic=magic)
            new_id = result.fetchone()[0]
            return Response(
                json.dumps(dict(success=True, id=new_id, image=filename_base, magic=magic)),
                headers=HEADERS
            )
    return Response(
        json.dumps(dict(success=False)),
        headers=HEADERS
    )