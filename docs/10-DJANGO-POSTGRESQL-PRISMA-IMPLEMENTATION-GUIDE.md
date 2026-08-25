# 🐍 Django + PostgreSQL + Prisma Implementation Guide

> **Problem Statement**: Expense Tracker Python Web Application Using Django  
> **Domain**: Web Application, Django  
> **Database & ORM**: PostgreSQL 16+ with Prisma (prisma-client-py) & Django REST Framework

---

## 1. Architecture & Stack Overview

This guide provides the complete setup and code implementation for building the backend with **Django 5.x**, **PostgreSQL 16+**, and **Prisma ORM**, integrating seamlessly with the existing React frontend.

```
┌─────────────────────────────────────────────────────────────┐
│                    React 19 Frontend (Vite)                 │
│         Axios / React Query  <--->  JSON REST APIs          │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / HTTPS (JWT Auth)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Django 5.x Web Application                │
│  ┌────────────────────────┐    ┌─────────────────────────┐  │
│  │ Django REST Framework  │    │ JWT Authentication      │  │
│  │ (Views, Serializers)   │    │ (djangorestframework-   │  │
│  │                        │    │  simplejwt)             │  │
│  └───────────┬────────────┘    └────────────┬────────────┘  │
│              │                              │               │
│  ┌───────────▼──────────────────────────────▼────────────┐  │
│  │          Prisma Python Client (Async/Sync)            │  │
│  │          schema.prisma (Typesafe Models)              │  │
│  └───────────────────────────┬───────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────┘
                               │ SQL Queries
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL 16 Database                   │
│   users, transactions, categories, budgets, audit_logs...   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Project Setup & Prerequisites

### 2.1 Python Environment & Dependencies

Create `requirements.txt`:
```txt
# Django Core & REST Framework
Django>=5.0,<5.2
djangorestframework>=3.15.0
django-cors-headers>=4.3.1
djangorestframework-simplejwt>=5.3.1
django-filter>=24.2

# Database & Prisma
prisma>=0.15.0
psycopg2-binary>=2.9.9
asyncio>=3.4.3

# Utilities & Async
pydantic>=2.7.0
python-dotenv>=1.0.1
Pillow>=10.3.0
celery>=5.4.0
redis>=5.0.4
whitenoise>=6.6.0
gunicorn>=22.0.0
```

Install dependencies:
```bash
python -m venv venv
# Windows
.\venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
```

---

## 3. Database & Prisma Setup

### 3.1 PostgreSQL Database Configuration
Create database and user:
```sql
CREATE DATABASE expense_tracker_db;
CREATE USER expense_user WITH ENCRYPTED PASSWORD 'secure_password_123';
GRANT ALL PRIVILEGES ON DATABASE expense_tracker_db TO expense_user;
```

### 3.2 Environment Variables (`.env`)
```env
DEBUG=True
SECRET_KEY=django-insecure-expense-tracker-ultra-secure-key-2026
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgresql://expense_user:secure_password_123@localhost:5432/expense_tracker_db
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
JWT_SECRET_KEY=jwt-secret-key-super-secure-token-2026
```

### 3.3 Initialize & Generate Prisma Client
```bash
prisma init
# After defining schema.prisma:
prisma db push
prisma generate
```

---

## 4. Django Core Configuration

### 4.1 Settings (`config/settings.py`)

```python
import os
from pathlib import Path
from datetime import timedelta
import dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
dotenv.load_dotenv(os.path.join(BASE_DIR, '.env'))

SECRET_KEY = os.getenv('SECRET_KEY')
DEBUG = os.getenv('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party apps
    'rest_framework',
    'corsheaders',
    'django_filters',
    'rest_framework_simplejwt',
    
    # Custom project apps
    'apps.users',
    'apps.transactions',
    'apps.categories',
    'apps.budgets',
    'apps.analytics',
    'apps.reports',
    'apps.notifications',
    'apps.audit',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'apps.audit.middleware.AuditLoggingMiddleware',
]

ROOT_URLCONF = 'config.urls'

WSGI_APPLICATION = 'config.wsgi.application'

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# SimpleJWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'SIGNING_KEY': os.getenv('JWT_SECRET_KEY', SECRET_KEY),
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# CORS Configuration
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:5173').split(',')
CORS_ALLOW_CREDENTIALS = True
```

---

## 5. Prisma Python Client Singleton

Create `utils/prisma_client.py`:

```python
from prisma import Prisma
import asyncio

_prisma_instance = None

def get_prisma() -> Prisma:
    """Returns singleton sync/async connected Prisma instance."""
    global _prisma_instance
    if _prisma_instance is None:
        _prisma_instance = Prisma(auto_register=True)
        if not _prisma_instance.is_connected():
            _prisma_instance.connect()
    return _prisma_instance

async def get_async_prisma() -> Prisma:
    """Returns async connected Prisma client."""
    db = Prisma(auto_register=True)
    if not db.is_connected():
        await db.connect()
    return db
```

---

## 6. Django REST Views Implementation

### 6.1 Transactions ViewSet (`apps/transactions/views.py`)

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from utils.prisma_client import get_prisma
from datetime import datetime
from decimal import Decimal

class TransactionListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        db = get_prisma()
        user_id = str(request.user.id)
        
        # Extract query parameters
        tx_type = request.query_params.get('type')
        category_id = request.query_params.get('category_id')
        method_id = request.query_params.get('payment_method_id')
        status_filter = request.query_params.get('status')
        search_query = request.query_params.get('search')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        sort_by = request.query_params.get('sort', '-date')

        # Build Prisma `where` filter dict
        where = {'userId': user_id}
        if tx_type and tx_type != 'all':
            where['type'] = tx_type
        if category_id and category_id != 'all':
            where['categoryId'] = category_id
        if method_id and method_id != 'all':
            where['paymentMethodId'] = method_id
        if status_filter and status_filter != 'all':
            where['status'] = status_filter
        if date_from and date_to:
            where['date'] = {
                'gte': datetime.strptime(date_from, '%Y-%m-%d'),
                'lte': datetime.strptime(date_to, '%Y-%m-%d')
            }
        if search_query:
            where['OR'] = [
                {'title': {'contains': search_query, 'mode': 'insensitive'}},
                {'notes': {'contains': search_query, 'mode': 'insensitive'}}
            ]

        # Determine order
        order = {'date': 'desc'}
        if sort_by == 'date':
            order = {'date': 'asc'}
        elif sort_by == '-date':
            order = {'date': 'desc'}
        elif sort_by == 'amount':
            order = {'amount': 'asc'}
        elif sort_by == '-amount':
            order = {'amount': 'desc'}
        elif sort_by == 'title':
            order = {'title': 'asc'}
        elif sort_by == '-title':
            order = {'title': 'desc'}

        transactions = db.transaction.find_many(
            where=where,
            order=order,
            include={'category': True, 'paymentMethod': True}
        )

        data = [{
            'id': t.id,
            'type': t.type,
            'title': t.title,
            'amount': float(t.amount),
            'date': t.date.strftime('%Y-%m-%d'),
            'time': t.time,
            'categoryId': t.categoryId,
            'paymentMethodId': t.paymentMethodId,
            'notes': t.notes,
            'status': t.status,
            'tags': t.tags,
            'category': {
                'id': t.category.id,
                'name': t.category.name,
                'icon': t.category.icon,
                'color': t.category.color
            } if t.category else None,
            'paymentMethod': {
                'id': t.paymentMethod.id,
                'name': t.paymentMethod.name,
                'icon': t.paymentMethod.icon
            } if t.paymentMethod else None
        } for t in transactions]

        return Response({'results': data, 'count': len(data)})

    def post(self, request):
        db = get_prisma()
        user_id = str(request.user.id)
        d = request.data

        tx = db.transaction.create(
            data={
                'userId': user_id,
                'type': d['type'],
                'title': d['title'],
                'amount': Decimal(str(d['amount'])),
                'date': datetime.strptime(d['date'], '%Y-%m-%d'),
                'time': d.get('time', datetime.now().strftime('%H:%M')),
                'categoryId': d['categoryId'],
                'paymentMethodId': d['paymentMethodId'],
                'sourceId': d.get('sourceId'),
                'notes': d.get('notes', ''),
                'status': d.get('status', 'completed'),
                'tags': d.get('tags', [])
            }
        )
        return Response({'id': tx.id, 'message': 'Transaction created successfully'}, status=status.HTTP_201_CREATED)


class TransactionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        db = get_prisma()
        user_id = str(request.user.id)
        d = request.data

        tx = db.transaction.update(
            where={'id': pk, 'userId': user_id},
            data={
                'title': d.get('title'),
                'amount': Decimal(str(d['amount'])) if 'amount' in d else None,
                'type': d.get('type'),
                'date': datetime.strptime(d['date'], '%Y-%m-%d') if 'date' in d else None,
                'categoryId': d.get('categoryId'),
                'paymentMethodId': d.get('paymentMethodId'),
                'notes': d.get('notes'),
                'status': d.get('status')
            }
        )
        return Response({'id': tx.id, 'message': 'Transaction updated successfully'})

    def delete(self, request, pk):
        db = get_prisma()
        user_id = str(request.user.id)
        db.transaction.delete(where={'id': pk, 'userId': user_id})
        return Response({'message': 'Transaction deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
```

---

## 7. Analytics & Aggregations Service (`apps/analytics/views.py`)

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from utils.prisma_client import get_prisma
from datetime import datetime, timedelta

class AnalyticsOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        db = get_prisma()
        user_id = str(request.user.id)

        txs = db.transaction.find_many(
            where={'userId': user_id, 'status': 'completed'}
        )

        total_income = sum(t.amount for t in txs if t.type == 'income')
        total_expense = sum(t.amount for t in txs if t.type == 'expense')
        net_savings = total_income - total_expense
        savings_rate = round((float(net_savings) / float(total_income) * 100), 1) if total_income > 0 else 0.0

        return Response({
            'totalIncome': float(total_income),
            'totalExpense': float(total_expense),
            'netSavings': float(net_savings),
            'savingsRate': savings_rate,
            'totalTransactions': len(txs)
        })
```

---

## 8. Automatic Audit Logging Middleware (`apps/audit/middleware.py`)

```python
from utils.prisma_client import get_prisma
from datetime import datetime

class AuditLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Log mutating actions (POST, PUT, PATCH, DELETE) for authenticated users
        if request.user.is_authenticated and request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            try:
                db = get_prisma()
                user_agent = request.META.get('HTTP_USER_AGENT', 'Unknown')
                ip_addr = request.META.get('REMOTE_ADDR', '127.0.0.1')
                
                action_name = f"{request.method}_{request.path.strip('/').split('/')[-1].upper()}"
                result = "success" if response.status_code < 400 else "failure"

                db.auditlog.create(
                    data={
                        'userId': str(request.user.id),
                        'action': action_name,
                        'entity': request.path,
                        'entityId': 'api-request',
                        'device': 'Web',
                        'browser': user_agent[:50],
                        'os': 'Detected',
                        'ip': ip_addr,
                        'result': result,
                        'timestamp': datetime.now()
                    }
                )
            except Exception as e:
                print(f"Audit log error: {e}")

        return response
```

---

## 9. Frontend API Integration Layer (Vite + Axios)

Create `src/lib/api-client.ts`:

```typescript
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach JWT Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Auto refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const res = await axios.post("http://localhost:8000/api/auth/refresh/", {
            refresh: refreshToken,
          });
          localStorage.setItem("access_token", res.data.access);
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
          return api(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/sign-in";
        }
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 10. Running the Full Stack Locally

### Step 1: Start PostgreSQL
Ensure PostgreSQL is running locally on port 5432.

### Step 2: Run Prisma Migrations & Django Server
```bash
# In backend directory:
prisma db push
python manage.py runserver 8000
```

### Step 3: Run React Frontend
```bash
# In project root:
npm run dev
```

The application will be live at `http://localhost:5173`, communicating seamlessly with the Django backend at `http://localhost:8000`.
