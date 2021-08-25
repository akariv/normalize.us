import os
from sqlalchemy import create_engine

if 'DATABASE_URL' in os.environ:
    engine = create_engine(os.environ['DATABASE_URL'])
    connection = engine.connect()
else:
    engine = connection = None