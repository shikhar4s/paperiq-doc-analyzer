# Use official Python 3.12.10 image
FROM python:3.12.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential libpq-dev curl && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Expose Django default port
EXPOSE 8000

# Collect static files (optional)
RUN python manage.py collectstatic --noinput

# Default command using Gunicorn
CMD ["gunicorn", "paperiq_backend.wsgi:application", "--bind", "0.0.0.0:8000"]
