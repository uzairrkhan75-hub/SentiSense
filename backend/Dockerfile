FROM python:3.12-slim

WORKDIR /app

# System deps kept minimal; scikit-learn/numpy ship manylinux wheels.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download NLTK data so first request is fast.
RUN python -m nltk.downloader -d /usr/local/share/nltk_data \
    punkt punkt_tab stopwords wordnet omw-1.4 \
    averaged_perceptron_tagger averaged_perceptron_tagger_eng
ENV NLTK_DATA=/usr/local/share/nltk_data

COPY . .

# Atlas's shared-tier (M0) TLS proxy negotiates ciphers that OpenSSL 3.x's
# default SECLEVEL=2 (Debian bookworm) rejects with TLSV1_ALERT_INTERNAL_ERROR.
# Relax to SECLEVEL=1 for this container so pymongo can complete the handshake.
ENV OPENSSL_CONF=/app/openssl-relaxed.cnf

EXPOSE 5000

# Render injects $PORT at runtime; default to 5000 for local `docker run`.
CMD gunicorn -w 2 -b 0.0.0.0:${PORT:-5000} --timeout 120 wsgi:app
