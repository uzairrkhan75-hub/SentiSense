from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from .config import Config
from .models.db import ensure_indexes

jwt = JWTManager()


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})
    jwt.init_app(app)

    from .routes.auth import auth_bp
    from .routes.analyze import analyze_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(analyze_bp, url_prefix="/api")

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "SentiSense"})

    @app.errorhandler(413)
    def too_large(_err):
        return jsonify({"error": "Uploaded file is too large (max 10 MB)."}), 413

    ensure_indexes(app)

    # Warm up the optional transformer model in the background so the first
    # analyze request is never blocked by the model load/download.
    from .services import transformer_model

    transformer_model.warmup()

    return app
