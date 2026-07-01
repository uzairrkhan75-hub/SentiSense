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

EXPOSE 5000

CMD ["python", "run.py"]
