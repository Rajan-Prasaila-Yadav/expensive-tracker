#!/bin/sh
set -e

echo "--> [Start] Initializing FinanceOS Django Backend..."

# Run Gunicorn using Python config file for fail-safe port binding
exec gunicorn -c gunicorn.conf.py config.wsgi:application
