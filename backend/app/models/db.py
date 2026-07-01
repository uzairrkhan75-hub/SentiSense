"""MongoDB connection and collection accessors.

The connection is created lazily so the rest of the app can still import this
module (and run rule-based analysis) even when MongoDB is unreachable.
"""
from flask import current_app, g
from pymongo import MongoClient, ASCENDING
from pymongo.errors import PyMongoError

_client = None


def get_client():
    global _client
    if _client is None:
        uri = current_app.config["MONGO_URI"]
        # serverSelectionTimeoutMS keeps requests from hanging when Mongo is down.
        _client = MongoClient(uri, serverSelectionTimeoutMS=3000)
    return _client


def get_db():
    """Return the default database from the configured Mongo URI."""
    if "db" not in g:
        client = get_client()
        g.db = client.get_default_database()
    return g.db


def get_users():
    return get_db()["users"]


def get_analyses():
    return get_db()["analyses"]


def ensure_indexes(app):
    """Create indexes once at startup. Failures are logged, not fatal."""
    with app.app_context():
        try:
            get_users().create_index([("email", ASCENDING)], unique=True)
            get_analyses().create_index([("user_id", ASCENDING)])
            app.logger.info("MongoDB indexes ensured.")
        except PyMongoError as exc:  # pragma: no cover - depends on env
            app.logger.warning("Could not create MongoDB indexes: %s", exc)
