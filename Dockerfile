FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PORT=5000 \
    ML_SERVICE_URL=http://127.0.0.1:5001 \
    PYTHON_EXEC=python3

# Install system utilities, curl, build essentials, and Node.js 18
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 2. Install Node.js dependencies
COPY backend/backend/package*.json ./backend/backend/
RUN cd backend/backend && npm install --production

# 3. Copy project files
COPY . .

# 4. Make startup script executable
RUN chmod +x start.sh

# Expose HTTP port
EXPOSE 5000

# Run both Python ML API and Node.js Express server
CMD ["/app/start.sh"]
