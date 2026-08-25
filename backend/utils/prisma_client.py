from prisma import Prisma
import os
import sys

_prisma_instance = None

def get_prisma() -> Prisma:
    """Returns singleton sync connected Prisma instance."""
    global _prisma_instance
    if _prisma_instance is None:
        _prisma_instance = Prisma(auto_register=True)
        if not _prisma_instance.is_connected():
            _prisma_instance.connect()
    elif not _prisma_instance.is_connected():
        _prisma_instance.connect()
    return _prisma_instance

def disconnect_prisma():
    """Cleanly disconnects the singleton Prisma client."""
    global _prisma_instance
    if _prisma_instance and _prisma_instance.is_connected():
        _prisma_instance.disconnect()
        _prisma_instance = None
