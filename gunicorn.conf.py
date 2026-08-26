import os

# Automatically resolve PORT from Railway environment or fallback to 8080
port = os.getenv("PORT", "8080")
if not port or not port.isdigit():
    port = "8080"

bind = f"0.0.0.0:{port}"
workers = 2
threads = 4
timeout = 120
accesslog = "-"
errorlog = "-"

print(f"--> [Gunicorn] Successfully bound to: {bind}")
