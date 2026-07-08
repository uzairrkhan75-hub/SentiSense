"""WSGI entry point for production servers (gunicorn on Render).

run.py is only for local development (python run.py) -- gunicorn imports
this module and serves the `app` object directly instead.
"""
from app import create_app

app = create_app()
