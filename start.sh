#!/bin/sh
set -e

echo "--> [Start] Initializing FinanceOS Django Backend..."

# Sync Prisma Schema with Supabase PostgreSQL
python -m prisma db push --schema=/app/schema.prisma || python -m prisma db push --schema=prisma/schema.prisma || echo "Prisma push warning"

# Run Gunicorn using Python config file for fail-safe port binding
exec gunicorn -c gunicorn.conf.py config.wsgi:application
