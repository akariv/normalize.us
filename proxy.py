import requests
from flask import Flask, Response
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def main():
    img = requests.get('https://thispersondoesnotexist.com/image').content
    return Response(img, mimetype='image/jpeg')

app.run()