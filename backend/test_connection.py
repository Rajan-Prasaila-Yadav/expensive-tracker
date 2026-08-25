import os
import sys
from pathlib import Path
import dotenv

# Load environment
dotenv.load_dotenv(Path(__file__).resolve().parent / '.env')

from prisma import Prisma

def main():
    print("Testing connection to Supabase PostgreSQL database...")
    db = Prisma()
    db.connect()
    print("Connected to Supabase PostgreSQL successfully!")
    
    # Check users count
    count = db.user.count()
    print(f"Current users count in PostgreSQL: {count}")
    
    db.disconnect()
    print("Connection closed cleanly.")

if __name__ == "__main__":
    main()
