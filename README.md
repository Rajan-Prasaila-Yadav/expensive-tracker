<div align="center">

# 💎 FinanceOS — Enterprise Expense Tracker & Wealth Manager
### Next-Generation Full-Stack Financial Operating System Built with React 19, Django 5 REST Framework, Supabase PostgreSQL, Prisma ORM & Progressive Web App (PWA)

[![Live Frontend](https://img.shields.io/badge/Live_Demo-Vercel_App-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://expensive-tracker-chi-three.vercel.app/)
[![Backend API](https://img.shields.io/badge/Backend_API-Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)](https://expensive-tracker-backend-production.up.railway.app/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Rajan-Prasaila-Yadav/expensive-tracker)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<br/>

```text
  ███████╗██╗███╗   ██╗ █████╗ ███╗   ██╗ ██████╗███████╗ ██████╗ ███████╗
  ██╔════╝██║████╗  ██║██╔══██╗████╗  ██║██╔════╝██╔════╝██╔═══██╗██╔════╝
  █████╗  ██║██╔██╗ ██║███████║██╔██╗ ██║██║     █████╗  ██║   ██║███████╗
  ██╔══╝  ██║██║╚██╗██║██╔══██║██║╚██╗██║██║     ██╔══╝  ██║   ██║╚════██║
  ██║     ██║██║ ╚████║██║  ██║██║ ╚████║╚██████╗███████╗╚██████╔╝███████║
  ╚═╝     ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝╚══════╝ ╚═════╝ ╚══════╝
```

<p align="center">
  <b>🌐 Live Application:</b> <a href="https://expensive-tracker-chi-three.vercel.app/">https://expensive-tracker-chi-three.vercel.app/</a><br/>
  <b>⚡ REST API Engine:</b> <a href="https://expensive-tracker-backend-production.up.railway.app/">https://expensive-tracker-backend-production.up.railway.app/</a>
</p>

</div>

---

## 📑 Table of Contents

- [🌟 Project Highlights & Tech Stack](#-project-highlights--tech-stack)
- [🏛️ Full-Stack System Architecture](#️-full-stack-system-architecture)
- [🔄 Zero-Sum Financial Data Flow](#-zero-sum-financial-data-flow)
- [📱 Module Catalog & Capabilities](#-module-catalog--capabilities)
- [📲 Progressive Web App & Native Install](#-progressive-web-app--native-install)
- [🚀 Local Development Setup](#-local-development-setup)
- [🌐 Complete Deployment Guide (Railway + Vercel)](#-complete-deployment-guide-railway--vercel)
- [🔐 Environment Variables Checklist](#-environment-variables-checklist)
- [🛡️ Security, RBAC & Audit Trail](#️-security-rbac--audit-trail)
- [🤝 Contributing & License](#-contributing--license)

---

## 🌟 Project Highlights & Tech Stack

FinanceOS is a production-grade personal finance suite designed to give users frictionless ledger tracking, real-time analytics, dynamic categorical budget caps, zero-sum wallet transfers, and automated security audit logging.

```mermaid
mindmap
  root((FinanceOS Core))
    Frontend Layer
      React 19 & TypeScript
      Vite 6 Fast Bundler
      TailwindCSS + Radix UI
      Motion & Lucide Icons
      PWA Service Worker
    Backend Layer
      Python 3.11+
      Django 5.x Framework
      Django REST Framework
      Prisma Client Python
      Gunicorn Production Server
    Database Layer
      Supabase Cloud PostgreSQL
      Prisma ORM Migrations
      Multi-Table Foreign Keys
      Zero-Sum Integrity
    Security & Cloud
      JWT & Bearer Tokens
      Automated Audit Middleware
      Vercel Global Edge CDN
      Railway Container Engine
```

### 🛠️ Technology Breakdown

| Layer | Technologies & Tools |
| :--- | :--- |
| **Frontend Client** | **React 19**, **TypeScript**, **Vite 6**, **TailwindCSS**, **Radix UI**, **Lucide React**, **Motion (Framer)**, **Recharts**, **Sonner** |
| **Backend API** | **Python 3.11**, **Django 5.x**, **Django REST Framework (DRF)**, **Gunicorn**, **Whitenoise** |
| **ORM & Database** | **Prisma ORM (Python Client)**, **Supabase PostgreSQL**, Connection Pooling |
| **Mobile & PWA** | **Progressive Web App (PWA)**, Service Worker (`sw.js`), Web App Manifest (`manifest.json`), Standalone App Shell |
| **Cloud Hosting** | **Vercel** (Frontend SPA + Global Edge CDN) & **Railway** (Dockerized Django REST Backend) |

---

## 🏛️ Full-Stack System Architecture

```mermaid
flowchart TB
    subgraph Users ["👤 Client Touchpoints"]
        Mobile["📱 Mobile Native PWA<br/>(iOS Safari / Android Chrome)"]
        Desktop["💻 Desktop Browser<br/>(Edge / Chrome / macOS)"]
    end

    subgraph CDN ["🌐 Vercel Global Edge Network"]
        VercelFrontend["⚛️ React 19 Single Page App<br/>https://expensive-tracker-chi-three.vercel.app"]
        PWAEngine["📲 Service Worker & App Manifest"]
    end

    subgraph BackendCloud ["⚡ Railway Cloud Container Engine"]
        Gunicorn["🐍 Gunicorn WSGI Server (Port 8080)"]
        DjangoCore["🛡️ Django 5.x REST Framework Engine"]
        AuditMW["📝 Automated AuditLoggingMiddleware"]
        AuthMW["🔑 Bearer Token & User Context Middleware"]
        APIEndpoints["📡 REST API Endpoints (/api/...)<br/>Txns • Income • Expenses • Budgets • Reports • Audit"]
    end

    subgraph DatabaseCloud ["🐘 Supabase Cloud Database"]
        PostgresDB[("Supabase PostgreSQL Cluster<br/>users • transactions • categories • budgets • audit_logs")]
    end

    Users <--> VercelFrontend
    VercelFrontend <--> PWAEngine
    VercelFrontend -- "REST API (Axios JSON)" --> Gunicorn
    Gunicorn --> DjangoCore
    DjangoCore --> AuthMW --> AuditMW --> APIEndpoints
    APIEndpoints -- "Prisma ORM Client" --> PostgresDB
```

---

## 🔄 Zero-Sum Financial Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 Authenticated User
    participant UI as ⚛️ React 19 UI (FinanceOS)
    participant API as 🐍 Django REST API
    participant Audit as 📝 Audit Middleware
    participant DB as 🐘 Supabase PostgreSQL

    User->>UI: Creates ₹5,000 Expense (Category: "Groceries", Account: "HDFC Bank")
    UI->>UI: Optimistic State Update & Haptic Feedback
    UI->>API: POST /api/transactions/ {type: "expense", amount: 5000, ...}
    API->>API: Authenticate User Token & Validate Schema
    API->>DB: INSERT INTO transactions & UPDATE payment_methods balance (-5000)
    DB-->>API: Transaction Committed (ID: UUIDv4)
    API->>Audit: Capture Device, OS, Browser, Action & Timestamp
    Audit->>DB: INSERT INTO audit_logs
    API-->>UI: 201 Created JSON Response
    UI->>UI: Recalculate KPIs, Donut Charts & Category Budgets
    UI-->>User: Toast Notification: "Expense Recorded Successfully"
```

---

## 📱 Module Catalog & Capabilities

| Module | Live Route | Features & Capabilities |
| :--- | :--- | :--- |
| **Home Dashboard** | [`/`](https://expensive-tracker-chi-three.vercel.app/) | Net Worth Summary, Income vs Expense KPI metrics, Interactive Spending Donut Chart, Category Budgets with Live Danger Meters, and Recent Activity ledger. |
| **Master Transactions** | [`/transactions`](https://expensive-tracker-chi-three.vercel.app/transactions) | Universal ledger, instant debounced search, category/account filter dropdowns, multi-column sorting, transaction receipt viewer, and CRUD modal manager. |
| **Income Streams** | [`/income`](https://expensive-tracker-chi-three.vercel.app/income) | Dynamic earning channels, interactive stream summary cards, deposit account tracking, 6-month earnings bar chart, and Excel/PDF export. |
| **Expense Tracker** | [`/expenses`](https://expensive-tracker-chi-three.vercel.app/expenses) | Category spending breakdown pills, 6-month outflow chart, account-specific outflow filters, live percentage calculators, and bulk exports. |
| **Internal Transfers** | [`/transfers`](https://expensive-tracker-chi-three.vercel.app/transfers) | Zero-sum wealth integrity tracking between bank accounts, wallets, and cash reserves. |
| **Budget Manager** | [`/budget`](https://expensive-tracker-chi-three.vercel.app/budget) | Monthly category spending caps, live overspending danger thresholds, color-coded progress indicators, and remaining allowance badges. |
| **Category & Stream Hub** | [`/categories`](https://expensive-tracker-chi-three.vercel.app/categories) | Manage custom expense categories, dynamic income streams, and multi-wallet payment accounts with custom emojis and base64 image logos. |
| **Analytics & Trends** | [`/analytics`](https://expensive-tracker-chi-three.vercel.app/analytics) | Monthly cash flow trend charts, Radar budget vs actual charts, spending breakdown distributions, and income stream contributions. |
| **Export Reports** | [`/reports`](https://expensive-tracker-chi-three.vercel.app/reports) | Instant export to **CSV / Excel** spreadsheet and printable **PDF Security Audit Reports** with custom date filters. |
| **Security Audit Trail** | [`/audit-logs`](https://expensive-tracker-chi-three.vercel.app/audit-logs) | Automated mutation logging with human-readable actions, workspace modules, client environment tracking (OS, Browser, IP), and interactive event inspector modals. |

---

## 📲 Progressive Web App & Native Install

FinanceOS is a full **Progressive Web App (PWA)** that can be installed directly onto any mobile phone, tablet, or desktop computer.

```text
┌────────────────────────────────────────────────────────┐
│                   📱 FinanceOS PWA                     │
│  • Instant Launch (Standalone Mode without browser UI) │
│  • Native Animated Splash Screen on Load               │
│  • Responsive Slide-out Sidebar Drawer                 │
│  • Fixed Bottom Navigation Tab Bar (Home/Txns/Profile) │
│  • Offline Asset Caching via Service Worker            │
└────────────────────────────────────────────────────────┘
```

### How to Install:
* **iOS (iPhone / iPad)**: Open in Safari ➔ Tap **Share** (`⎋`) ➔ Tap **Add to Home Screen**.
* **Android**: Open in Chrome ➔ Tap **Install App** (or use the in-app Download button).
* **Desktop (Windows / Mac / Linux)**: Click the **Install** icon in the Chrome / Edge URL bar.

---

## 🚀 Local Development Setup

### 📌 Prerequisites
* **Node.js**: v20.x or higher
* **Python**: 3.11 or higher
* **Git**: Installed and configured

---

### 1️⃣ Step 1: Clone Repository

```bash
git clone https://github.com/Rajan-Prasaila-Yadav/expensive-tracker.git
cd expensive-tracker
```

---

### 2️⃣ Step 2: Start Django REST Backend

```powershell
# In project root:
$env:PYTHONUTF8 = "1"
.\backend\venv\Scripts\python backend/manage.py runserver 0.0.0.0:8000
```
> 💡 Check health at: `http://127.0.0.1:8000/`

---

### 3️⃣ Step 3: Start React 19 Frontend

Open a second terminal window:

```powershell
cd frontend
npm install
npm run dev
```
> 🌐 Access locally at: `http://localhost:5173/`

---

## 🌐 Complete Deployment Guide (Railway + Vercel)

```mermaid
graph LR
    A["1. Supabase Cloud<br/>(PostgreSQL)"] --> B["2. Railway Container<br/>(Django REST Backend)"]
    B --> C["3. Vercel Edge<br/>(React 19 Frontend)"]
    C --> D["🎉 Live Production<br/>Full-Stack App"]
```

---

### 🐍 Part 1: Deploy Django Backend to Railway

#### Run from: `C:\Users\rajan\Desktop\Expenses Tracker\backend`

1. Go to **[https://railway.app](https://railway.app)** and click **`+ New Project` ➔ `Deploy from GitHub repo`**.
2. Select repository: **`Rajan-Prasaila-Yadav/expensive-tracker`**.
3. In **Settings ➔ Source**:
   * **Root Directory**: `/backend`
4. In **Settings ➔ Build**:
   * **Builder**: `DOCKERFILE`
   * **Custom Build Command**: *(Leave empty)*
5. In **Variables**, add:
   ```env
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require
   DJANGO_SECRET_KEY=your-super-secret-django-key-here
   DEBUG=False
   ALLOWED_HOSTS=.railway.app,.vercel.app,localhost,127.0.0.1
   CORS_ALLOWED_ORIGINS=https://expensive-tracker-chi-three.vercel.app,http://localhost:5173
   PYTHON_VERSION=3.11
   ```
6. In **Settings ➔ Networking**: Click **`Generate Domain`** (Port: `8080`).
   * Generated URL: `https://expensive-tracker-backend-production.up.railway.app`

---

### ⚛️ Part 2: Deploy React Frontend to Vercel

#### Run from: `C:\Users\rajan\Desktop\Expenses Tracker\frontend`

1. Go to **[https://vercel.com](https://vercel.com)** and click **`Add New…` ➔ `Project`**.
2. Import **`Rajan-Prasaila-Yadav/expensive-tracker`**.
3. In **Project Configuration**:
   * **Framework Preset**: `Vite`
   * **Root Directory**: `frontend`
4. In **Environment Variables** *(Set Type = `Config`)*:
   ```env
   VITE_SUPABASE_URL = https://pbfxcabqqaboqejcgjkx.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOi...
   VITE_API_URL = https://expensive-tracker-backend-production.up.railway.app/api
   ```
5. Click **`Deploy`**!

---

## 🔐 Environment Variables Checklist

### Backend Configuration (`backend/.env` or Railway Variables)
| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | ✅ | Supabase PostgreSQL URI with SSL mode | `postgresql://postgres:pwd@host:5432/postgres?sslmode=require` |
| `DJANGO_SECRET_KEY` | ✅ | Cryptographic signing key for Django | `django-insecure-prod-key-xyz...` |
| `DEBUG` | ✅ | Disable verbose error pages in production | `False` |
| `ALLOWED_HOSTS` | ✅ | Allowed HTTP host headers | `.railway.app,.vercel.app,localhost,127.0.0.1` |
| `CORS_ALLOWED_ORIGINS` | ✅ | Allowed frontend origins | `https://expensive-tracker-chi-three.vercel.app,http://localhost:5173` |

### Frontend Configuration (`frontend/.env` or Vercel Variables)
| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `VITE_SUPABASE_URL` | ✅ | Supabase Project API URL | `https://pbfxcabqqaboqejcgjkx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase Anonymous Client API Key | `eyJhbGciOi...` |
| `VITE_API_URL` | ✅ | Live Railway Django REST API Endpoint | `https://expensive-tracker-backend-production.up.railway.app/api` |

---

## 🛡️ Security, RBAC & Audit Trail

* **JWT Bearer Authentication**: Every API request is verified against authenticated Supabase JWT tokens.
* **Automated Audit Trail**: Captures user agent, OS, browser, IP address, exact action performed, timestamp, and target entity for every mutation.
* **Row-Level User Isolation**: SQL queries and Prisma filters enforce strict `userId` boundaries so no user can access or modify another user's financial ledger.
* **Zero-Sum Transaction Integrity**: Internal transfers strictly balance debits and credits between source and destination payment accounts.

---

## 🤝 Contributing & License

Contributions, feature requests, and issues are welcome! Feel free to check the [Issues page](https://github.com/Rajan-Prasaila-Yadav/expensive-tracker/issues).

Distributed under the **MIT License**. See `LICENSE` for more information.

<div align="center">
  <br/>
  <b>Made with ❤️ by <a href="https://github.com/Rajan-Prasaila-Yadav">Rajan Prasaila Yadav</a></b><br/>
  <i>FinanceOS — Engineering Better Financial Futures</i>
</div>
