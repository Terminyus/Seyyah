"""Pexels'ten mekan fotoğraflarını indirip webp'ye çevirir.

Kullanım:  python3 tools/fetch_pexels.py
Anahtar .env içindeki PEXELS_API_KEY'den okunur (repoya girmez).
Çıktı: assets/photos/<slug>.webp ve assets/photos/credits.json
"""
import json, os, pathlib, subprocess, sys, tempfile, urllib.parse, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'photos'

PLACES = {
    'kapadokya': 'Cappadocia balloons Goreme valley',
    'pamukkale': 'Pamukkale travertine',
    'galata': 'Galata Tower Istanbul',
    'nemrut': 'Nemrut mountain stone heads',
    'kas': 'Kas Antalya sea',
    'mardin': 'Mardin old city',
    'safranbolu': 'Safranbolu houses',
    'uzungol': 'Uzungol Trabzon',
}


def api_key():
    key = os.environ.get('PEXELS_API_KEY')
    env = ROOT / '.env'
    if not key and env.exists():
        for line in env.read_text().splitlines():
            if line.startswith('PEXELS_API_KEY='):
                key = line.split('=', 1)[1].strip()
    if not key:
        sys.exit('PEXELS_API_KEY bulunamadı (.env veya ortam değişkeni).')
    return key


def get(url, key=None):
    req = urllib.request.Request(url, headers={'User-Agent': 'seyyah-web-build'})
    if key:
        req.add_header('Authorization', key)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def main():
    key = api_key()
    OUT.mkdir(parents=True, exist_ok=True)
    credits = {}
    tmp = pathlib.Path(tempfile.mkdtemp(prefix='pexels-'))
    for slug, query in PLACES.items():
        q = urllib.parse.urlencode({'query': query, 'per_page': 15, 'orientation': 'landscape'})
        data = json.loads(get(f'https://api.pexels.com/v1/search?{q}', key))
        if not data.get('photos'):
            print('sonuç yok:', slug)
            continue
        # Tanınabilir kişi içeren kareleri ele; en büyük çözünürlüklüyü seç.
        people = ('woman', 'man ', 'girl', 'boy', 'person', 'tourist', 'people', 'couple')
        cands = [p for p in data['photos'] if not any(w in (p.get('alt') or '').lower() for w in people)]
        if not cands:
            print('uygun kare yok:', slug)
            continue
        photo = max(cands[:3], key=lambda p: p['width'])
        raw = tmp / f'{slug}.jpg'
        raw.write_bytes(get(photo['src']['large2x']))
        dst = OUT / f'{slug}.webp'
        subprocess.run(['cwebp', '-quiet', '-q', '72', '-resize', '1200', '0', str(raw), '-o', str(dst)], check=True)
        credits[slug] = {
            'photographer': photo['photographer'],
            'photographer_url': photo['photographer_url'],
            'url': photo['url'],
            'alt': photo.get('alt') or query,
        }
        print(f'{slug}: {photo["photographer"]} ({dst.stat().st_size // 1024} KB)')
    (OUT / 'credits.json').write_text(json.dumps(credits, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
