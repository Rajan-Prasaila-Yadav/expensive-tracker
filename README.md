# 💰 FinanceOS — Personal Expense Tracker & Multi-Wallet Manager

> **Academic Project Specification**: Expense Tracker Python Web Application Using Django & React 19  
> **Domain**: Full-Stack Financial Technology (FinTech), Django REST Framework, React 19, Supabase PostgreSQL, Prisma ORM, and Progressive Web App (PWA)  
> **Architecture**: Decoupled Monorepo (React 19 SPA + Django 5.x REST Framework + Supabase PostgreSQL + Prisma ORM + PWA Engine)  

---

## 🏛️ System Architecture Diagram

```mermaid
graph TD
    subgraph Client ["📱 Client Layer (Mobile PWA / Tablet / Desktop)"]
        React["⚛️ React 19 + TypeScript (Vite)"]
        PWA["📲 Progressive Web App (Service Worker + Manifest)"]
        Router["React Router v7 (Protected Routes)"]
        Store["Custom State Hooks (useTransactions, useAuth)"]
        Axios["Axios API Client (/api Proxy)"]
    end

    subgraph Backend ["🐍 Application Layer (Django 5.x REST Framework)"]
        API["Django API Router (/api/)"]
        AuthMid["get_authenticated_user_id & Auth Middleware"]
        AuditMid["Automatic AuditLoggingMiddleware"]
        Views["Class-Based API Views (Txns, Budgets, Categories, Reports, Audit)"]
    end

    subgraph Cloud ["☁️ Data & Persistence Layer (Supabase Cloud)"]
        Postgres[("🐘 Supabase PostgreSQL (users, transactions, categories, incomesources, budgets, audit_logs)")]
    end

    React --> Router --> Store --> Axios
    Axios -- "HTTP / REST API" --> API
    API --> AuthMid --> AuditMid --> Views
    Views -- "Prisma ORM (Python Client)" --> Postgres
```

---

## ✨ Features & Module Catalog

| Module | Route | Highlights & Capabilities |
| :--- | :--- | :--- |
| **Home Dashboard** | `/` | Total Net Worth, Income/Expense KPI Cards, Dynamic Category Donut Chart, Active Budgets with live progress bars, Recent Transactions with Type-Specific badges. |
| **Master Transactions** | `/transactions` | Universal ledger, instant debounced keyword search, multi-field filter, multi-column sorting (Date, Amount, Description), CRUD modals, and Receipt image attachment. |
| **Income Streams** | `/income` | Dynamic earning channels, interactive stream summary cards, deposit account tracking, 6-month earnings bar chart, and Excel/PDF export. |
| **Expense Tracker** | `/expenses` | Category spending breakdown pills, 6-month outflow chart, account-specific outflow filters, live percentage calculators, and bulk exports. |
| **Internal Transfers** | `/transfers` | Zero-sum wealth integrity tracking between bank accounts, wallets, and cash reserves. |
| **Budget Manager** | `/budget` | Monthly category spending caps, live overspending danger thresholds, color-coded progress indicators, and remaining allowance badges. |
| **Category & Stream Hub** | `/categories` | Manage custom expense categories, dynamic income streams, and multi-wallet payment accounts with custom emojis and base64 image logos. |
| **Analytics & Trends** | `/analytics` | Monthly cash flow trend charts, Radar budget vs actual charts, spending breakdown distributions, and income stream contributions. |
| **Export Reports** | `/reports` | Instant export to **CSV / Excel** spreadsheet and printable **PDF Security Audit Reports** with custom date filters. |
| **Security Audit Trail** | `/audit-logs` | Automated mutation logging with human-readable actions, workspace modules, client environment tracking (OS, Browser, IP), and interactive event inspector modals. |
| **Progressive Web App** | Global | Standalone native app installation on iOS, Android, macOS, and Windows with animated splash screen, offline caching, and responsive slide-out drawer. |

---

## 🚀 How to Run Locally

### 📌 Prerequisites
* **Python**: 3.11 or higher
* **Node.js**: 20 or higher
* **Database**: Supabase PostgreSQL (Configured in `.env`)

---

### 1️⃣ Step 1: Start the Backend (Django 5.x REST API)

Open a terminal at the project root:

```powershell
# Set UTF-8 encoding and start Django server:
$env:PYTHONUTF8 = "1"
.\backend\venv\Scripts\python backend/manage.py runserver 0.0.0.0:8000
```

> 💡 **Backend Health Check**: Open [`http://127.0.0.1:8000/`](http://127.0.0.1:8000/)  
> Response: `{"status": "healthy", "service": "FinanceOS Django REST Backend", "database": "PostgreSQL via Prisma"}`

---

### 2️⃣ Step 2: Start the Frontend (React 19 + Vite)

Open a second terminal window:

```powershell
cd frontend
npm run dev
```

> 🌐 **Access App**: Open [`http://localhost:5173/`](http://localhost:5173/)

---

### 3️⃣ Step 3: Database Synchronization (Prisma ORM)

```powershell
# Push schema updates to Supabase PostgreSQL:
.\backend\venv\Scripts\python -m prisma db push

# Regenerate Python Prisma Client:
.\backend\venv\Scripts\python -m prisma generate
```

---

## 🌐 Complete Deployment Guide (Step-by-Step)

### 💡 Recommended Production Architecture
* **Frontend**: Deploy to **Vercel** or **Netlify** or **Cloudflare Pages** (Free, instant global CDN, automatic HTTPS).
* **Backend**: Deploy to **Railway.app**, **Render.com**, or **Fly.io** (Native Python 3.11+ support, persistent gunicorn runner).
* **Database**: Hosted on **Supabase PostgreSQL** or **Neon PostgreSQL** (Serverless, automated backups).

---

### 📋 Deployment Sequence (What to Deploy First)

> ⚠️ **CRITICAL RULE**: Always deploy your **Database & Backend FIRST**, obtain your live Backend URL (e.g. `https://financeos-api.up.railway.app`), and then deploy your **Frontend** with the backend URL configured.

```text
[Step 1: Supabase Database] ➔ [Step 2: Django Backend on Railway/Render] ➔ [Step 3: React Frontend on Vercel]
```

---

### 🗄️ Step 1: Prepare Database (Supabase PostgreSQL)
1. Log in to [Supabase](https://supabase.com) and create a project.
2. Go to **Project Settings ➔ Database** and copy the **URI Connection String** (e.g. `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?sslmode=require`).

---

### 🐍 Step 2: Deploy Backend to Railway or Render

#### Option A: Railway.app (Recommended)
1. Go to [Railway.app](https://railway.app) and click **New Project ➔ Deploy from GitHub repo**.
2. Select your repository.
3. In **Settings ➔ Root Directory**, specify `/backend` (or set the start command from root).
4. Add the following **Environment Variables** in Railway:
   ```env
   PYTHON_VERSION=3.11
   DJANGO_SECRET_KEY=your-production-django-secret-key-here
   DEBUG=False
   DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres?sslmode=require
   ALLOWED_HOSTS=.railway.app,.onrender.com,.vercel.app
   CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
   ```
5. **Start Command**:
   ```bash
   python -m prisma generate && python -m prisma db push && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
   ```
6. Copy your generated Railway URL (e.g. `https://financeos-api.up.railway.app`).

---

### ⚛️ Step 3: Deploy Frontend to Vercel

1. Go to [Vercel](https://vercel.com) and click **Add New ➔ Project**.
2. Import your GitHub repository.
3. In **Project Configuration**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
4. Add the following **Environment Variables** in Vercel:
   ```env
   VITE_SUPABASE_URL=https://[your-project-id].supabase.co
   VITE_SUPABASE_ANON_KEY=[your-supabase-anon-key]
   VITE_API_URL=https://financeos-api.up.railway.app/api
   ```
5. Click **Deploy**. Vercel will build and launch your live application with automated SSL and PWA support!

---

## 🔑 Environment Variables Checklist

### Backend (`.env` or Cloud Dashboard)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Supabase / PostgreSQL URI | `postgresql://postgres:pwd@host:5432/postgres?sslmode=require` |
| `DJANGO_SECRET_KEY` | Cryptographic secret for Django | `django-insecure-prod-key-xyz...` |
| `DEBUG` | Toggle debug mode (`False` in prod) | `False` |
| `ALLOWED_HOSTS` | Allowed domain names | `localhost,127.0.0.1,.railway.app,.vercel.app` |
| `CORS_ALLOWED_ORIGINS` | Allowed frontend origins | `http://localhost:5173,https://financeos.vercel.app` |

### Frontend (`.env` or Vercel Dashboard)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Supabase Project URL | `https://xyzcompany.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anonymous Client Key | `eyJhbGciOi...` |
| `VITE_API_URL` | Target Django REST API URL | `https://financeos-api.up.railway.app/api` |

---

## 📦 GitHub Initial Commit & Push Commands

To upload your project to GitHub for the first time:

```bash
# 1. Initialize git repository (if not already done)
git init

# 2. Stage all project files (node_modules, venvs, and secrets are auto-ignored by .gitignore)
git add .

# 3. Create your first official commit
git commit -m "feat(core): initial release of FinanceOS - full-stack personal finance & expense tracker with Django, React 19, PostgreSQL, and PWA"

# 4. Set default branch to main
git branch -M main

# 5. Link your remote GitHub repository
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git

# 6. Push code to GitHub
git push -u origin main
```
