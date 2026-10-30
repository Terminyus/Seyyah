"""Uygulamanın (~/Desktop/seyyah) karakalem varlıklarını siteye taşır.

Kullanım:  python3 tools/import_app_assets.py [uygulama_klasörü]

- assets/stickers/*.svg  -> assets/stickers/  (45 etiket glifi + 3 nadirlik çerçevesi)
- assets/vignettes/*.svg -> assets/vignettes/ (kategori vinyetleri)
- assets/icon/*          -> assets/icon.png (taramalı ikon, 512 px) ve assets/logo-yazi.png

Uygulama SVG'leri siyah çizilip temaya göre boyanıyor (ColorFilter srcIn). Sitede tek tema
olduğu için siyah, mürekkep mavisine (#1F4FBF) çevrilir; c2pa/metadata blokları atılır.
"""
import pathlib, re, sys
from PIL import Image

INK = '#1f4fbf'
ROOT = pathlib.Path(__file__).resolve().parent.parent
APP = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '~/Desktop/seyyah').expanduser()


def ink_svg(src: pathlib.Path, dst: pathlib.Path):
    s = src.read_text(encoding='utf-8')
    s = re.sub(r'<metadata>.*?</metadata>', '', s, flags=re.S)
    s = re.sub(r'\s+xmlns:c2pa="[^"]*"', '', s)
    s = re.sub(r'(fill|stroke)="#0{3}(?:0{3})?"', rf'\1="{INK}"', s)
    s = re.sub(r'(fill|stroke):\s*#0{3}(?:0{3})?\b', rf'\1:{INK}', s)
    s = re.sub(r'(fill|stroke)="black"', rf'\1="{INK}"', s)
    # boyutu CSS belirlesin
    s = re.sub(r'(<svg\b[^>]*?)\s+width="\d+"\s+height="\d+"', r'\1', s, count=1)
    dst.write_text(s, encoding='utf-8')
    return len(s)


def main():
    total = 0
    for sub in ('stickers', 'vignettes'):
        out = ROOT / 'assets' / sub
        out.mkdir(parents=True, exist_ok=True)
        files = sorted((APP / 'assets' / sub).glob('*.svg'))
        for f in files:
            total += ink_svg(f, out / f.name)
        print(f'{sub}: {len(files)} svg')
    icon = Image.open(APP / 'assets/icon/seyyah_ikon_taramali_1024.png').convert('RGBA')
    icon.resize((512, 512), Image.LANCZOS).save(ROOT / 'assets/icon.png', optimize=True)
    icon.resize((180, 180), Image.LANCZOS).save(ROOT / 'assets/apple-touch-icon.png', optimize=True)
    word = Image.open(APP / 'assets/icon/seyyah_yazi_logo_seffaf.png').convert('RGBA')
    word = word.crop(word.getbbox())
    h = 96
    word.resize((round(word.width * h / word.height), h), Image.LANCZOS).save(ROOT / 'assets/logo-yazi.png', optimize=True)
    print('ikonlar güncellendi; toplam svg boyutu', total // 1024, 'KB')


if __name__ == '__main__':
    main()
