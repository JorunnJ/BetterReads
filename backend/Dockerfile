# Använd en officiell Python-bild
FROM python:3.10

# Sätt arbetskatalogen
WORKDIR /app

# Kopiera nödvändiga filer
COPY requirements.txt .

# Installera beroenden
RUN pip install --no-cache-dir -r requirements.txt

# Kopiera resten av backend-koden
COPY . .

# Starta Django-servern
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
