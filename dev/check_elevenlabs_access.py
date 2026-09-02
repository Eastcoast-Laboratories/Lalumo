import json
import urllib.error
import urllib.request
from pathlib import Path

api_key = (
    Path.home() / '.config/devin/elevenlabs-api-key'
).read_text().strip()
if not api_key.startswith('sk_'):
    raise SystemExit(
        'Local file still does not contain an sk_ API key'
    )
headers = {'xi-api-key': api_key}
for label, url in (
    ('subscription', 'https://api.elevenlabs.io/v1/user/subscription'),
    ('voices', 'https://api.elevenlabs.io/v1/voices'),
):
    try:
        request = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(request, timeout=30) as response:
            data = json.load(response)
        if label == 'subscription':
            print('subscription_access=ok')
            print(
                'subscription_tier='
                + str(data.get('tier', 'unknown'))
            )
            print(
                'characters_used='
                + str(data.get('character_count', 'unknown'))
            )
            print(
                'characters_limit='
                + str(data.get('character_limit', 'unknown'))
            )
        else:
            matches = [
                voice for voice in data.get('voices', [])
                if voice.get('voice_id') == 'IVxwm9rCsOWlqz6D2vB3'
            ]
            print('voice_list_access=ok')
            print(
                'requested_voice_found=' + ('yes' if matches else 'no')
            )
            if matches:
                print(
                    'voice_name='
                    + str(matches[0].get('name', 'unknown'))
                )
    except urllib.error.HTTPError as error:
        try:
            detail = json.loads(error.read().decode()).get('detail', {})
            if isinstance(detail, dict):
                detail = (
                    detail.get('message')
                    or detail.get('status')
                    or 'unknown'
                )
        except (
            AttributeError,
            UnicodeDecodeError,
            json.JSONDecodeError,
        ):
            detail = 'unavailable'
        print(
            f'{label}_access=failed status={error.code} '
            f'detail={detail}'
        )
