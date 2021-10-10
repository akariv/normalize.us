import logging
import os
import json
from flask import Response
import requests
from sqlalchemy.sql import text

from .net import HEADERS
from .db import engine


OUR_EMAIL = 'me@normalizi.ng'
REPLY_TO_EMAIL = 'mushon@shual.com'
REPLY_TO_NAME = 'Mushon Zer-Aviv'
mark_updated = text('UPDATE faces SET last_shown_1=null, last_shown_2=null WHERE id=:id and magic=:magic')


def send_email_handler(request):
    if request.method == 'OPTIONS':
        return Response('', headers=HEADERS)
    if request.method == 'POST':
        content = request.json
        to_email = content['email']
        link = content['link']
        send = to_email is not None
        own_id = content['own_id']
        magic = content['magic']

        success = True
        error = None
        if send:
            subject = 'Normalizi.ng / Your face'
            message = f'''
            <p>Thanks for <a href='https://normalizi.ng'>normalizi.ng</a></p>

            <p>Through this private link you can always view, share, retake, or delete your data:</p>

            <a href='{link}'>{link}</a>

            <p>Thanks,</p>

            <p>Mushon Zer-Aviv<br/>
            <a href='https://normalizi.ng'>normalizi.ng</a></p>
            '''

            try:
                response = requests.post(
                    'https://api.eu.mailgun.net/v3/normalizi.ng/messages',
                    auth=('api', os.environ['MAILGUN_API_KEY']),
                    data={'from': OUR_EMAIL,
                        'to': to_email,
                        'subject': subject,
                        'html': message})
                print('GOT', response.status_code, response.text)
                if response.status_code != 200:
                    success = False
                    error = response.text

            except Exception as ex:
                success = False
                error = str(ex)
                print('ERROR', repr(ex), error)

        with engine.connect() as connection:
            logging.info(f'Marking {own_id} with {magic} as updated')
            connection.execute(mark_updated, id=own_id, magic=magic)

    return Response(
        json.dumps(dict(success=success, error=error)),
        headers=HEADERS
    )
