#!/bin/sh
set -e

PORT="${PORT:-8080}"
echo "--> Starting FinanceOS Django Backend on port: $PORT"

# Sync Prisma Schema with Supabase PostgreSQL
echo "--> Pushing Prisma Schema to PostgreSQL..."
python -m prisma db push --schema=/app/schema.prisma || echo "Prisma db push warning, continuing..."

# Run Gunicorn
echo "--> Launching Gunicorn WSGI Server..."
exec gunicorn config.wsgi:application --bind "0.0.0.0:$PORT" --workers 2 --threads 4 --timeout 120
