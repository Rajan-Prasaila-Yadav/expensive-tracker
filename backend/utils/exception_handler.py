import logging
import traceback
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """
    Custom exception handler to ensure that 500 errors return clear JSON
    instead of raw HTML crash pages.
    """
    response = exception_handler(exc, context)
    if response is None:
        tb = traceback.format_exc()
        logger.error("Unhandled Exception: %s\n%s", str(exc), tb)
        return Response({
            "error": f"Server processing error: {str(exc)}",
            "detail": str(exc),
            "exception_type": type(exc).__name__,
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    return response
