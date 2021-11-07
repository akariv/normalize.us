import codecs
import json
from sqlalchemy.sql import text
from flask import Request, Response
from PIL import Image
from io import BytesIO
import uuid
import geocoder

from .db import engine
from .net import HEADERS, upload_fileobj_s3

fetch_item = text('''SELECT magic from FACES WHERE id = :id''')
insert_new = text('''
    INSERT INTO FACES (image, descriptor, landmarks, gender_age, geolocation, place_name, last_shown_1, last_shown_2, magic) 
               VALUES (:image, :descriptor, :landmarks, :gender_age, :geolocation, :place_name, now(), now(), :magic) RETURNING id
''')
update_existing = text('''
    UPDATE FACES set image=:image, descriptor=:descriptor, landmarks=:landmarks, gender_age=:gender_age, geolocation=:geolocation, place_name=:place_name, allowed=3
                 where id=:id and magic=:magic
''')
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
            magic = content.get('magic') or uuid.uuid4().hex

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

            geolocation = content.get('geolocation')
            place_name = ''
            if geolocation:
                try:
                    ret = geocoder.google(geolocation, method='reverse')
                    place_name = '%s, %s' % (ret.city_long, ret.country_long)
                except:
                    try:
                        place_name = '%.2f, %.2f' % tuple(geolocation)
                    except:
                        pass
            geolocation = json.dumps(geolocation)

            id = content.get('id')

            with engine.connect() as connection:
                updated = False
                if id and magic:
                    rows = connection.execute(fetch_item, id=id)
                    for row in rows:
                        row = dict(row)
                        if row['magic'] == magic:
                            result = connection.execute(update_existing, image=filename_base, descriptor=descriptor, landmarks=landmarks, 
                                                        gender_age=gender_age, geolocation=geolocation, place_name=place_name, magic=magic, id=id)
                            updated = True
                            new_id = id
                if not updated:
                    result = connection.execute(insert_new, image=filename_base, descriptor=descriptor, landmarks=landmarks, 
                                                gender_age=gender_age, geolocation=geolocation, place_name=place_name, magic=magic)
                    new_id = result.fetchone()[0]
            return Response(
                json.dumps(dict(success=True, id=new_id, image=filename_base, magic=magic)),
                headers=HEADERS
            )
    return Response(
        json.dumps(dict(success=False)),
        headers=HEADERS
    )