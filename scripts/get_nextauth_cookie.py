import argparse
import sys
from typing import Iterable, List, Optional, Tuple
from urllib.parse import urlparse

import browser_cookie3

COOKIE_NAMES = [
    '__Secure-next-auth.session-token',
    'next-auth.session-token',
]


def normalize_base_url(url: str) -> str:
    if not url.startswith('http://') and not url.startswith('https://'):
        return f'http://{url}'
    return url


def get_hostname(base_url: str) -> str:
    parsed = urlparse(base_url)
    if not parsed.hostname:
        raise ValueError(f'Invalid base URL: {base_url}')
    return parsed.hostname


def load_cookie_jar(browser: str, domain_name: str):
    browser = browser.lower()
    if browser == 'chrome':
        return browser_cookie3.chrome(domain_name=domain_name)
    if browser == 'edge':
        return browser_cookie3.edge(domain_name=domain_name)
    if browser == 'firefox':
        return browser_cookie3.firefox(domain_name=domain_name)
    if browser == 'brave':
        return browser_cookie3.brave(domain_name=domain_name)
    if browser == 'chromium':
        return browser_cookie3.chromium(domain_name=domain_name)
    if browser == 'opera':
        return browser_cookie3.opera(domain_name=domain_name)
    raise ValueError(f'Unsupported browser: {browser}')


def iter_browsers(selected: str) -> Iterable[str]:
    if selected == 'auto':
        return ['edge', 'chrome', 'brave', 'chromium', 'firefox', 'opera']
    return [selected]


def find_nextauth_cookie(base_url: str, browser: str) -> Tuple[Optional[str], Optional[str], List[str]]:
    domain_name = get_hostname(base_url)
    errors: List[str] = []

    for b in iter_browsers(browser):
        try:
            jar = load_cookie_jar(b, domain_name)
        except Exception as exc:
            errors.append(f'{b}: {exc}')
            continue

        found = {name: None for name in COOKIE_NAMES}
        for cookie in jar:
            if cookie.name in found and cookie.value:
                found[cookie.name] = cookie.value

        for cookie_name in COOKIE_NAMES:
            if found[cookie_name]:
                return b, f'{cookie_name}={found[cookie_name]}', errors

        errors.append(f'{b}: NextAuth cookie not found for domain {domain_name}')

    return None, None, errors


def main() -> int:
    parser = argparse.ArgumentParser(description='Extract NextAuth session cookie from local browser for automation.')
    parser.add_argument('--base-url', default='http://localhost:3000', help='App base URL (default: http://localhost:3000)')
    parser.add_argument(
        '--browser',
        default='auto',
        choices=['auto', 'edge', 'chrome', 'firefox', 'brave', 'chromium', 'opera'],
        help='Browser to read cookies from (default: auto).',
    )
    parser.add_argument('--powershell-env', action='store_true', help='Print a PowerShell env assignment command.')
    args = parser.parse_args()

    base_url = normalize_base_url(args.base_url)

    browser_used, cookie_kv, errors = find_nextauth_cookie(base_url, args.browser)

    if not cookie_kv:
        print('ERROR: Could not find a valid NextAuth session cookie.', file=sys.stderr)
        if errors:
            print('Details:', file=sys.stderr)
            for line in errors:
                print(f'  - {line}', file=sys.stderr)
        print('\nMake sure you have signed in to the app in the selected browser first.', file=sys.stderr)
        return 2

    if args.powershell_env:
        escaped = cookie_kv.replace("'", "''")
        print(f"$env:NEXTAUTH_COOKIE='{escaped}'")
        return 0

    print(cookie_kv)
    print(f'# browser={browser_used}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
