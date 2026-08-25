# 🔌 REST API Specification & Data Contracts

> Complete REST API interface contracts for the Expense Tracker Django Backend, specifying headers, query parameters, request bodies, response shapes, and error structures.

---

## 1. Global API Standards

- **Base URL**: `http://localhost:8000/api`
- **Content Type**: `application/json`
- **Authentication**: JWT Bearer Token in `Authorization: Bearer <access_token>`
- **Date Format**: ISO 8601 (`YYYY-MM-DD`)
- **Time Format**: 24-hour string (`HH:mm`)
- **Currency Values**: Decimal (2 decimal places) represented as floating numbers in JSON

---

## 2. Authentication Endpoints

### 2.1 Register New User
- **Endpoint**: `POST /api/auth/register/`
- **Access**: Public
- **Request Body**:
```json
{
  "name": "Alex Johnson",
  "email": "alex@example.com",
  "password": "SecurePassword123!"
}
```
- **Response `201 Created`**:
```json
{
  "user": {
    "id": "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "name": "Alex Johnson",
    "email": "alex@example.com"
  },
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2.2 Login & Token Refresh
- **Endpoint**: `POST /api/auth/login/`
- **Request Body**: `{"email": "alex@example.com", "password": "SecurePassword123!"}`
- **Response `200 OK`**: Returns `access` and `refresh` tokens + user profile object.

- **Endpoint**: `POST /api/auth/refresh/`
- **Request Body**: `{"refresh": "refresh_token_here"}`
- **Response `200 OK`**: `{"access": "new_access_token_here"}`

### 2.3 Forgot Password (Request 6-Digit Verification Code)
- **Endpoint**: `POST /api/auth/forgot-password/`
- **Request Body**: `{"email": "user@example.com"}`
- **Response `200 OK`**:
```json
{
  "message": "Verification code has been sent to user@example.com.",
  "email": "user@example.com",
  "expiresInMinutes": 15
}
```

### 2.4 Verify OTP Code
- **Endpoint**: `POST /api/auth/verify-otp/`
- **Request Body**: `{"email": "user@example.com", "otp": "703097"}`
- **Response `200 OK`**: `{"valid": true, "message": "Code verified successfully."}`

### 2.5 Set New Password in Database
- **Endpoint**: `POST /api/auth/reset-password/`
- **Request Body**: `{"email": "user@example.com", "otp": "703097", "newPassword": "NewSecurePassword123!"}`
- **Response `200 OK`**: `{"message": "Password successfully updated in PostgreSQL database. Please sign in."}`

---

## 3. Transactions API

### 3.1 List Transactions (Filtered, Sorted, Paginated)
- **Endpoint**: `GET /api/transactions/`
- **Query Parameters**:
  - `search` (string): Keyword matching title/notes
  - `type` (enum): `income` | `expense` | `transfer` | `all`
  - `category_id` (uuid): Filter by category
  - `payment_method_id` (uuid): Filter by payment method
  - `status` (enum): `completed` | `pending` | `failed`
  - `date_from` (ISO date): e.g. `2026-01-01`
  - `date_to` (ISO date): e.g. `2026-01-31`
  - `sort` (string): `date` | `-date` | `amount` | `-amount` | `title` | `-title`
  - `page` (int): Page number (default: 1)
  - `page_size` (int): Items per page (default: 20)

- **Response `200 OK`**:
```json
{
  "count": 45,
  "next": "http://localhost:8000/api/transactions/?page=2",
  "previous": null,
  "results": [
    {
      "id": "tx_12345",
      "type": "expense",
      "title": "Whole Foods Grocery",
      "amount": 142.50,
      "date": "2026-08-24",
      "time": "14:30",
      "categoryId": "cat_groceries",
      "paymentMethodId": "pm_hdfc_card",
      "notes": "Weekly groceries",
      "status": "completed",
      "tags": ["groceries", "food"],
      "category": {
        "id": "cat_groceries",
        "name": "Groceries",
        "icon": "🛒",
        "color": "#10b981"
      },
      "paymentMethod": {
        "id": "pm_hdfc_card",
        "name": "HDFC Credit Card",
        "icon": "💳"
      }
    }
  ]
}
```

### 3.2 Create Transaction
- **Endpoint**: `POST /api/transactions/`
- **Request Body**:
```json
{
  "type": "expense",
  "title": "Starbucks Coffee",
  "amount": 4.75,
  "date": "2026-08-25",
  "time": "09:15",
  "categoryId": "cat_dining",
  "paymentMethodId": "pm_apple_pay",
  "notes": "Morning latte",
  "status": "completed",
  "tags": ["coffee"]
}
```
- **Response `201 Created`**: `{"id": "tx_67890", "message": "Transaction created successfully"}`

### 3.3 Update Transaction
- **Endpoint**: `PUT /api/transactions/{id}/`
- **Request Body**: Subset or full payload of transaction fields.
- **Response `200 OK`**: Updated transaction entity.

### 3.4 Delete Transaction
- **Endpoint**: `DELETE /api/transactions/{id}/`
- **Response `204 No Content`**

---

## 4. Budgets API

### 4.1 List Budgets with Live Spent Calculations
- **Endpoint**: `GET /api/budgets/`
- **Query Parameter**: `period` (`all` | `monthly` | `weekly` | `yearly`)
- **Response `200 OK`**:
```json
{
  "results": [
    {
      "id": "bgt_101",
      "categoryId": "cat_dining",
      "period": "monthly",
      "limit": 400.00,
      "spent": 312.50,
      "startDate": "2026-08-01",
      "endDate": "2026-08-31",
      "category": {
        "id": "cat_dining",
        "name": "Dining & Drinks",
        "icon": "🍽️",
        "color": "#f59e0b"
      }
    }
  ]
}
```

---

## 5. Analytics & Dashboard KPIs API

### 5.1 Dashboard Overview
- **Endpoint**: `GET /api/analytics/overview/`
- **Response `200 OK`**:
```json
{
  "totalBalance": 18450.75,
  "monthlyIncome": 6200.00,
  "monthlyExpense": 3410.20,
  "savingsRate": 45.0,
  "budgetUtilizationPct": 78.4,
  "recentTransactions": [...]
}
```

### 5.2 Monthly Trends Chart Data
- **Endpoint**: `GET /api/analytics/monthly-trend/?months=6`
- **Response `200 OK`**:
```json
{
  "data": [
    {"month": "Mar", "income": 5800, "expense": 3100, "net": 2700},
    {"month": "Apr", "income": 6100, "expense": 3400, "net": 2700},
    {"month": "May", "income": 5900, "expense": 2900, "net": 3000},
    {"month": "Jun", "income": 6300, "expense": 3600, "net": 2700},
    {"month": "Jul", "income": 6500, "expense": 3300, "net": 3200},
    {"month": "Aug", "income": 6200, "expense": 3410, "net": 2790}
  ]
}
```

---

## 6. Reports & CSV Export API

### 6.1 Generate Filtered Report Data
- **Endpoint**: `GET /api/reports/generate/`
- **Query Parameters**: `start_date`, `end_date`, `type`, `category_id`, `payment_method_id`, `status`
- **Response `200 OK`**: Aggregated totals, category breakdown, and transaction items.

### 6.2 Stream CSV Export File
- **Endpoint**: `GET /api/reports/export/csv/`
- **Headers**:
  - `Content-Type: text/csv; charset=utf-8`
  - `Content-Disposition: attachment; filename="transactions-report-2026-08.csv"`
- **Response Body**: Raw CSV string with UTF-8 BOM.

---

## 7. Audit Logs API

### 7.1 List Security & Activity Events
- **Endpoint**: `GET /api/audit-logs/`
- **Query Parameters**: `result` (`success` | `failure` | `warning` | `all`), `search`
- **Response `200 OK`**:
```json
{
  "results": [
    {
      "id": "log_99",
      "timestamp": "2026-08-25T11:45:00Z",
      "action": "TRANSACTION_CREATE",
      "entity": "/api/transactions/",
      "device": "MacBook Pro",
      "browser": "Chrome 128",
      "os": "macOS",
      "ip": "192.168.1.45",
      "result": "success"
    }
  ]
}
```

---

## 8. Standard Error Responses

All API errors return a uniform JSON format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid transaction data provided.",
    "details": {
      "amount": ["Amount must be greater than 0."],
      "categoryId": ["Category does not exist."]
    }
  }
}
```

| HTTP Status | Meaning |
|---|---|
| `400 Bad Request` | Validation failure or malformed payload |
| `401 Unauthorized` | Missing or expired JWT access token |
| `403 Forbidden` | Access denied for this resource |
| `404 Not Found` | Entity ID not found |
| `500 Server Error` | Unexpected backend exception |
