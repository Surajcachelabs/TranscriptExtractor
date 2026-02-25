import argparse
import sys
import time
from datetime import datetime
from pathlib import Path
from automate_transcripts import (
    append_output_row,
    build_session,
    initialize_output,
    read_input_rows,
    transcribe_link,
)
from get_nextauth_cookie import find_nextauth_cookie, normalize_base_url

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent


def main() -> int:
    parser = argparse.ArgumentParser(
        description='One-command run: extract NextAuth cookie from browser and batch transcribe Excel links.'
    )
    parser.add_argument('--input', type=Path, default=PROJECT_ROOT / 'Data' / 'sample_input.xlsx', help='Input Excel path.')
    parser.add_argument('--output', type=Path, default=None, help='Output Excel path.')
    parser.add_argument('--base-url', default='http://localhost:3000', help='App base URL.')
    parser.add_argument(
        '--browser',
        default='auto',
        choices=['auto', 'edge', 'chrome', 'firefox', 'brave', 'chromium', 'opera'],
        help='Browser used for Google sign-in (default: auto).',
    )
    parser.add_argument('--timeout', type=int, default=1800, help='Timeout in seconds per transcription request (default: 30 minutes).')
    parser.add_argument('--sleep', type=float, default=0.5, help='Sleep seconds between requests.')
    args = parser.parse_args()

    base_url = normalize_base_url(args.base_url).rstrip('/')

    browser_used, cookie_kv, errors = find_nextauth_cookie(base_url, args.browser)
    if not cookie_kv:
        print('ERROR: Unable to extract NextAuth cookie from browser.', file=sys.stderr)
        if errors:
            print('Details:', file=sys.stderr)
            for line in errors:
                print(f'  - {line}', file=sys.stderr)
        print('\nSign in to the app in your browser first, then re-run this command.', file=sys.stderr)
        return 2

    print(f'Cookie found from browser: {browser_used}')

    try:
        records = read_input_rows(args.input)
    except Exception as exc:
        print(f'ERROR reading input file: {exc}', file=sys.stderr)
        return 2

    if not records:
        print('No valid rows found in input.')
        return 0

    try:
        session = build_session(base_url, cookie_kv)
    except Exception as exc:
        print(f'ERROR creating authenticated session: {exc}', file=sys.stderr)
        return 2

    output_path = args.output or PROJECT_ROOT / 'Data' / f"transcripts_output_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    initialize_output(output_path)

    total = len(records)

    for idx, (member, link) in enumerate(records, start=1):
        print(f'[{idx}/{total}] Processing: {member or "(blank name)"}')
        transcript, err = transcribe_link(session, base_url, link, args.timeout)
        if err:
            transcript = f'ERROR: {err}'
        append_output_row(output_path, (member, link, transcript))
        if idx < total and args.sleep > 0:
            time.sleep(args.sleep)

    print(f'Done. Output saved to: {output_path}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
