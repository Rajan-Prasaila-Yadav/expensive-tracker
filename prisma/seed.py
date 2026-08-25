import os
import sys
from decimal import Decimal
from prisma import Prisma

DEFAULT_CATEGORIES = [
    {"name": "Housing & Rent", "icon": "🏠", "color": "#ef4444", "type": "expense"},
    {"name": "Groceries & Food", "icon": "🛒", "color": "#10b981", "type": "expense"},
    {"name": "Dining & Drinks", "icon": "🍽️", "color": "#f59e0b", "type": "expense"},
    {"name": "Transportation", "icon": "🚗", "color": "#3b82f6", "type": "expense"},
    {"name": "Utilities & Bills", "icon": "⚡", "color": "#8b5cf6", "type": "expense"},
    {"name": "Entertainment", "icon": "🎬", "color": "#ec4899", "type": "expense"},
    {"name": "Healthcare & Fitness", "icon": "💊", "color": "#06b6d4", "type": "expense"},
    {"name": "Shopping", "icon": "🛍️", "color": "#f97316", "type": "expense"},
    {"name": "Salary & Wages", "icon": "💼", "color": "#22c55e", "type": "income"},
    {"name": "Freelance & Consulting", "icon": "💻", "color": "#14b8a6", "type": "income"},
    {"name": "Investments & Dividends", "icon": "📈", "color": "#6366f1", "type": "income"},
    {"name": "Account Transfer", "icon": "🔄", "color": "#3b82f6", "type": "transfer"},
]

DEFAULT_PAYMENT_METHODS = [
    {"name": "Primary Bank Account", "type": "bank", "icon": "🏦", "balance": Decimal("45000.00"), "last4": "8842"},
    {"name": "HDFC Credit Card", "type": "card", "icon": "💳", "balance": Decimal("15000.00"), "last4": "4242"},
    {"name": "Google Pay (UPI)", "type": "upi", "icon": "📱", "balance": Decimal("5200.00"), "last4": None},
    {"name": "Cash in Wallet", "type": "cash", "icon": "💵", "balance": Decimal("3500.00"), "last4": None},
]

DEFAULT_INCOME_SOURCES = [
    {"name": "Full-time Employment", "type": "salary", "icon": "💼", "color": "#22c55e", "monthlyAvg": Decimal("85000.00")},
    {"name": "Freelance Projects", "type": "freelance", "icon": "💻", "color": "#14b8a6", "monthlyAvg": Decimal("25000.00")},
    {"name": "Mutual Funds & Stocks", "type": "investment", "icon": "📈", "color": "#6366f1", "monthlyAvg": Decimal("8000.00")},
]

def seed_user_defaults(db: Prisma, user_id: str):
    """Seed standard categories, payment methods, and income sources for a user."""
    print(f"Seeding default financial data for user: {user_id}")
    
    # 1. Categories
    for cat in DEFAULT_CATEGORIES:
        existing = db.category.find_first(where={"userId": user_id, "name": cat["name"]})
        if not existing:
            db.category.create(
                data={
                    "userId": user_id,
                    "name": cat["name"],
                    "icon": cat["icon"],
                    "color": cat["color"],
                    "type": cat["type"],
                }
            )

    # 2. Payment Methods
    for pm in DEFAULT_PAYMENT_METHODS:
        existing = db.paymentmethod.find_first(where={"userId": user_id, "name": pm["name"]})
        if not existing:
            db.paymentmethod.create(
                data={
                    "userId": user_id,
                    "name": pm["name"],
                    "type": pm["type"],
                    "icon": pm["icon"],
                    "balance": pm["balance"],
                    "last4": pm.get("last4"),
                }
            )

    # 3. Income Sources
    for src in DEFAULT_INCOME_SOURCES:
        existing = db.incomesource.find_first(where={"userId": user_id, "name": src["name"]})
        if not existing:
            db.incomesource.create(
                data={
                    "userId": user_id,
                    "name": src["name"],
                    "type": src["type"],
                    "icon": src["icon"],
                    "color": src["color"],
                    "monthlyAvg": src["monthlyAvg"],
                }
            )

    # 4. User Settings
    settings = db.usersettings.find_unique(where={"userId": user_id})
    if not settings:
        db.usersettings.create(
            data={
                "userId": user_id,
                "budgetAlerts": True,
                "transactionAlerts": True,
                "weeklyReport": True,
                "monthlyReport": False,
                "securityAlerts": True,
                "emailDigest": False,
                "compactMode": False,
                "showBalance": True,
                "animations": True,
                "theme": "system",
            }
        )

    print(f"Defaults successfully seeded for user {user_id}")

if __name__ == "__main__":
    db = Prisma()
    db.connect()
    users = db.user.find_many()
    for u in users:
        seed_user_defaults(db, u.id)
    db.disconnect()
