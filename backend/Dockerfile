# Build stage
FROM python:3.11-slim AS builder

WORKDIR /code

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Run stage
FROM python:3.11-slim AS runner

WORKDIR /code

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed libraries from builder
COPY --from=builder /root/.local /root/.local
COPY --from=builder /code /code

# Set PATH to include local user binaries
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1

COPY ./app ./app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
