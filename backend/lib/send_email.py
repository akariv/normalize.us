import os
import json
from flask import Response
import requests

from .net import HEADERS

our_email = 'me@normalizi.ng'
reply_to_email = 'mushon@shual.com'
reply_to_name = 'Mushon Zer-Aviv'

def send_email_handler(request):
  if request.method == 'POST':
    content = request.json
    to_email = content['email']
    link = content['link']

    subject = 'Normalizi.ng / Your face'
    message = f'''
    <p>Thanks for <a href='https://normalizi.ng'>normalizi.ng</a></p>

    <p>Through this private link you can always view, share, retake, or delete your data:</p>

    <a href='{link}'>{link}</a>

    <p>Thanks,</p>

    <p>Mushon Zer-Aviv<br/>
    <a href='https://normalizi.ng'>normalizi.ng</a></p>
    '''

    success = True
    error = None
    try:
      response = requests.post(
        'https://api.eu.mailgun.net/v3/normalizi.ng',
        auth=('api', os.environ['MAILGUN_API_KEY']),
        data={'from': our_email,
              'to': to_email,
              'subject': subject,
              'text': message})
      if response.status_code != 200:
        success = False
        error = response.text
    except Exception as e:
      success = False
      error = str(e)
      print('ERROR', repr(e), error)

    return Response(
        json.dumps(dict(success=success, error=error)),
        headers=HEADERS
    )