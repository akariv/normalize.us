import os
from sqlalchemy import create_engine
import sqlalchemy

engine: sqlalchemy.engine.Engine
if 'DATABASE_URL' in os.environ:
    engine = create_engine(os.environ['DATABASE_URL'])
else:
    engine = None
