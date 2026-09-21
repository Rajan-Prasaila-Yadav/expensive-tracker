from prisma import Prisma
import os
import sys
import logging

logger = logging.getLogger(__name__)

_prisma_instance = None

def fix_database_url():
    """
    Ensure DATABASE_URL uses the Supabase Session Pooler (IPv4 compatible)
    if direct IPv6 Supabase host is configured, preventing connection timeouts
    on cloud platforms like Railway that only route IPv4.
    """
    db_url = os.environ.get("DATABASE_URL", "")
    if "db.pbfxcabqqaboqejcgjkx.supabase.co" in db_url:
        fixed_url = "postgresql://postgres.pbfxcabqqaboqejcgjkx:1VgIlffYlMtA1KZR@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
        os.environ["DATABASE_URL"] = fixed_url
        return fixed_url
    return db_url

def get_prisma() -> Prisma:
    """Returns singleton sync connected Prisma instance."""
    global _prisma_instance
    fix_database_url()
    if _prisma_instance is None:
        _prisma_instance = Prisma(auto_register=True)
        if not _prisma_instance.is_connected():
            try:
                _prisma_instance.connect()
            except Exception as e:
                logger.error(f"Prisma connection error: {e}")
                raise
    elif not _prisma_instance.is_connected():
        try:
            _prisma_instance.connect()
        except Exception as e:
            logger.error(f"Prisma reconnection error: {e}")
            raise
    return _prisma_instance

def disconnect_prisma():
    """Cleanly disconnects the singleton Prisma client."""
    global _prisma_instance
    if _prisma_instance and _prisma_instance.is_connected():
        _prisma_instance.disconnect()
        _prisma_instance = None
