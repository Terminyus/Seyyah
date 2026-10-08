"""Yasal sayfaları yeni temayla üretir; metinlere dokunmaz.

Kaynak: tools/legal-src/<sayfa>.html (seyyah.info'dan alınan özgün sayfalar)
Çıktı:  <sayfa>/index.html  (aynı URL yapısı: /gizlilik_politikasi, /kullanim_sartlari, /kvkk, /veri_silme)

Kullanım: python3 tools/build_legal.py
Özgün sayfadaki <header class="legal-hero"> ile <footer> arasındaki içerik birebir
kopyalanır; yalnızca site içi linkler göreli yollara çevrilir.
"""
import html, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = [
    ('gizlilik_politikasi', 'Gizlilik Politikası'),
    ('kullanim_sartlari', 'Kullanım Şartları'),
    ('kvkk', 'KVKK'),
    ('veri_silme', 'Veri Silme'),
]

TEMPLATE = """<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <!-- ÖNİZLEME: canlıya (seyyah.info) geçerken bu satırı kaldırın. Bkz. README -->
  <meta name="robots" content="noindex, nofollow">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <link rel="canonical" href="https://seyyah.info/{slug}">
  <meta name="theme-color" content="#faf8f3">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:url" content="https://seyyah.info/{slug}">
  <meta property="og:image" content="https://seyyah.info/assets/icon.png">
  <link rel="icon" type="image/png" href="../assets/icon.png">
  <link rel="preload" href="../assets/fonts/caveat-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="../assets/fonts/caveat-latin-ext.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="../assets/css/site.css">
</head>
<body class="legal">
<a class="skip-link" href="#icerik">İçeriğe geç</a>
<header class="nav scrolled">
  <div class="wrap nav-inner">
    <a class="brand" href="../" aria-label="Seyyah ana sayfa"><img src="../assets/icon.png" alt="" width="36" height="36">Seyyah</a>
    <a class="btn btn-primary nav-cta" style="display:inline-flex;margin-left:auto" href="../#indir">Uygulamayı İndir</a>
  </div>
</header>
<main id="icerik">
<div class="wrap" style="max-width:868px;padding-top:22px">
  <nav aria-label="Yasal sayfalar">
    <ul class="legal-nav">
      <li><a class="u-draw" href="../">Ana Sayfa</a></li>
{links}
    </ul>
  </nav>
</div>
<!-- içerik: seyyah.info/{slug} sayfasından birebir -->
{content}
</main>
<footer class="footer">
  <div class="wrap footer-grid">
    <div>
      <a class="brand" href="../"><img src="../assets/icon.png" alt="" width="36" height="36" loading="lazy">Seyyah</a>
      <p class="made">Evden çıkanlar için yapıldı.</p>
      <small>© 2026 Seyyah · Candemsoft. Tüm hakları saklıdır.</small>
    </div>
    <nav aria-label="Alt menü">
      <ul>
        <li><a class="u-draw" href="../gizlilik_politikasi/">Gizlilik Politikası</a></li>
        <li><a class="u-draw" href="../kullanim_sartlari/">Kullanım Şartları</a></li>
        <li><a class="u-draw" href="../kvkk/">KVKK</a></li>
        <li><a class="u-draw" href="../veri_silme/">Veri Silme</a></li>
        <li><a class="u-draw" href="mailto:info@seyyah.info">İletişim</a></li>
      </ul>
    </nav>
  </div>
</footer>
</body>
</html>
"""


def rewrite_links(s):
    s = re.sub(r'href="/#get"', 'href="../#indir"', s)
    s = re.sub(r'href="/"', 'href="../"', s)
    s = re.sub(r'href="/([a-z_]+)"', r'href="../\1/"', s)
    s = re.sub(r'(src|href)="assets/', r'\1="../assets/', s)
    return s


def main():
    for slug, label in PAGES:
        src = (ROOT / 'tools' / 'legal-src' / f'{slug}.html').read_text(encoding='utf-8')
        title = html.unescape(re.search(r'<title>(.*?)</title>', src, re.S).group(1).strip())
        desc = html.unescape(re.search(r'name="description" content="([^"]*)"', src).group(1))
        content = src[src.index('<header class="legal-hero"'):src.index('<footer')].rstrip()
        content = rewrite_links(content)
        links = '\n'.join(
            f'      <li><a class="u-draw" href="../{s}/"{" aria-current=\"page\"" if s == slug else ""}>{l}</a></li>'
            for s, l in PAGES)
        out = TEMPLATE.format(title=html.escape(title, quote=False), desc=html.escape(desc), slug=slug, links=links, content=content)
        d = ROOT / slug
        d.mkdir(exist_ok=True)
        (d / 'index.html').write_text(out, encoding='utf-8')
        print('yazıldı:', d / 'index.html')


if __name__ == '__main__':
    main()
