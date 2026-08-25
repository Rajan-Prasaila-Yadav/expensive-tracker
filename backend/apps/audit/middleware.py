from datetime import datetime
from utils.prisma_client import get_prisma

def parse_user_agent(ua_string: str) -> tuple[str, str, str]:
    """Parse raw User-Agent into clean (Device, Browser, OS)."""
    ua = ua_string or ""
    
    # OS
    os_name = "Desktop"
    if "Windows" in ua:
        os_name = "Windows"
    elif "Macintosh" in ua or "Mac OS" in ua:
        os_name = "macOS"
    elif "Android" in ua:
        os_name = "Android"
    elif "iPhone" in ua or "iPad" in ua:
        os_name = "iOS"
    elif "Linux" in ua:
        os_name = "Linux"

    # Browser
    browser_name = "Web Browser"
    if "Edg/" in ua:
        browser_name = "Microsoft Edge"
    elif "Chrome/" in ua and "Edg/" not in ua:
        browser_name = "Google Chrome"
    elif "Safari/" in ua and "Chrome/" not in ua:
        browser_name = "Apple Safari"
    elif "Firefox/" in ua:
        browser_name = "Mozilla Firefox"

    # Device
    device_type = "Mobile Device" if ("Mobile" in ua or "Android" in ua or "iPhone" in ua) else "Desktop Computer"

    return device_type, browser_name, os_name


def map_action_details(method: str, path: str) -> tuple[str, str, str]:
    """Map raw HTTP method & path into clean Action Name, Module Name, and Human Description."""
    p = path.strip('/')
    parts = p.split('/')
    resource = parts[1] if len(parts) > 1 else 'general'

    action_map = {
        'POST': 'Created',
        'PUT': 'Updated',
        'PATCH': 'Modified',
        'DELETE': 'Deleted',
    }
    verb = action_map.get(method, 'Accessed')

    if 'income-source' in p:
        module = 'Income Streams'
        action = f"{verb} Income Stream"
        desc = f"{verb} an income stream in your financial workspace."
    elif 'payment-method' in p:
        module = 'Accounts & Wallets'
        action = f"{verb} Payment Account"
        desc = f"{verb} a payment method / bank wallet account."
    elif 'categor' in p:
        module = 'Categories'
        action = f"{verb} Category"
        desc = f"{verb} a financial spending or earning category."
    elif 'transaction' in p:
        module = 'Transactions'
        action = f"{verb} Transaction Record"
        desc = f"{verb} a transaction entry in your financial ledger."
    elif 'budget' in p:
        module = 'Budgets'
        action = f"{verb} Budget Target"
        desc = f"{verb} a monthly category spending budget target."
    elif 'auth' in p or 'profile' in p:
        module = 'Security & Profile'
        action = f"{verb} User Security Settings"
        desc = f"{verb} user authentication or profile credentials."
    else:
        module = 'System'
        action = f"{verb} System Entity"
        desc = f"{verb} a record in the system."

    return action, module, desc


from utils.auth_helper import get_authenticated_user_id

class AuditLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Automatically log write/mutate operations
        if request.method in ['POST', 'PUT', 'DELETE', 'PATCH'] and request.path.startswith('/api/'):
            try:
                db = get_prisma()
                user_id = get_authenticated_user_id(request)

                if not user_id:
                    first_u = db.user.find_first()
                    user_id = first_u.id if first_u else None

                if user_id:
                    raw_ua = request.META.get('HTTP_USER_AGENT', '')
                    device_type, browser_name, os_name = parse_user_agent(raw_ua)
                    ip_addr = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '127.0.0.1'))
                    if ',' in ip_addr:
                        ip_addr = ip_addr.split(',')[0].strip()

                    action_title, module_name, event_desc = map_action_details(request.method, request.path)
                    result = 'success' if response.status_code < 400 else 'failure'

                    db.auditlog.create(
                        data={
                            'userId': user_id,
                            'action': action_title,
                            'entity': module_name,
                            'entityId': event_desc,
                            'device': f"{browser_name} ({os_name})",
                            'browser': browser_name,
                            'os': os_name,
                            'ip': ip_addr,
                            'result': result,
                            'timestamp': datetime.now(),
                        }
                    )
            except Exception:
                # Silently catch so requests never fail due to audit logging
                pass

        return response
