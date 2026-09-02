import json
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

voice_id = 'IVxwm9rCsOWlqz6D2vB3'
key_path = Path.home() / '.config/devin/elevenlabs-api-key'
strings_path = Path('/var/www/Musici/android/app/src/main/res/values-it/strings.xml')
output_dir = Path('/var/www/Musici/public/sounds/info-messages')
recordings = {
    '1_1_firststage_it.mp3': 'high_or_low_intro_stage1',
    '1_1_secondstage_it.mp3': 'high_or_low_intro_stage3',
    '1_2_practice_it.mp3': 'match_sounds_practice',
    '1_2_game_it.mp3': 'match_sounds_game',
    '1_3_intro_it.mp3': 'intro_1_3_pitches_draw',
    '1_4_intro_it.mp3': 'intro_1_4_pitches_does_it_sound_right',
    '1_5_practice_it.mp3': 'memory_practice',
    '1_5_game_it.mp3': 'memory_game_intro',
    '2_1_intro_it.mp3': 'intro_2_1_chords_color_matching',
    '2_2_intro_it.mp3': 'intro_2_2_chords_stable_unstable',
    '2_5_intro_it.mp3': 'intro_2_5_chords_characters',
    '2_6_intro_it.mp3': 'intro_2_6_chords_one_or_many',
}
api_key = key_path.read_text().strip()
strings = {node.attrib['name']: (node.text or '').replace("\\'", "'") for node in ET.parse(strings_path).getroot()}
url = f'https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?' + urllib.parse.urlencode({'output_format': 'mp3_44100_128'})
created = 0
characters = 0
for filename, string_key in recordings.items():
    destination = output_dir / filename
    if destination.exists():
        print(f'skipped_existing={filename}')
        continue
    text = strings[string_key].replace('🌲', '').replace('✨', '').strip()
    payload = json.dumps({
        'text': text,
        'model_id': 'eleven_multilingual_v2',
        'language_code': 'it',
    }, ensure_ascii=False).encode('utf-8')
    request = urllib.request.Request(url, data=payload, headers={
        'xi-api-key': api_key,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
    }, method='POST')
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            audio = response.read()
    except urllib.error.HTTPError as error:
        try:
            detail = json.loads(error.read().decode()).get('detail', {})
            if isinstance(detail, dict):
                detail = detail.get('message') or detail.get('status') or 'unknown'
        except Exception:
            detail = 'unavailable'
        raise SystemExit(f'generation_failed={filename} status={error.code} detail={detail}')
    if not audio.startswith(b'ID3') and not audio.startswith(b'\xff'):
        raise SystemExit(f'generation_failed={filename} reason=unexpected_response')
    destination.write_bytes(audio)
    created += 1
    characters += len(text)
    print(f'created={filename} bytes={len(audio)}')
print(f'created_count={created}')
print(f'characters_submitted={characters}')
