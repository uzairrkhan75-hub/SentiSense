import re

import bcrypt
from bson import ObjectId
from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token
from pymongo.errors import DuplicateKeyError, PyMongoError

from ..models.db import get_users

auth_bp = Blueprint("auth", __name__)

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _hash_password(password: str) -> bytes:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())


def _check_password(password: str, hashed: bytes) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed)
    except (ValueError, TypeError):
        return False


@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not name or not email or not password:
        return jsonify({"error": "Name, email and password are required."}), 400
    if not _EMAIL_RE.match(email):
        return jsonify({"error": "Invalid email address."}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400

    try:
        users = get_users()
        result = users.insert_one(
            {"name": name, "email": email, "password": _hash_password(password)}
        )
    except DuplicateKeyError:
        return jsonify({"error": "An account with this email already exists."}), 409
    except PyMongoError:
        return jsonify({"error": "Database unavailable. Please try again later."}), 503

    user_id = str(result.inserted_id)
    token = create_access_token(identity=user_id)
    return (
        jsonify({"token": token, "user": {"id": user_id, "name": name, "email": email}}),
        201,
    )


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    try:
        user = get_users().find_one({"email": email})
    except PyMongoError:
        return jsonify({"error": "Database unavailable. Please try again later."}), 503

    if not user or not _check_password(password, user["password"]):
        return jsonify({"error": "Invalid email or password."}), 401

    user_id = str(user["_id"])
    token = create_access_token(identity=user_id)
    return jsonify(
        {
            "token": token,
            "user": {"id": user_id, "name": user.get("name"), "email": user["email"]},
        }
    )
