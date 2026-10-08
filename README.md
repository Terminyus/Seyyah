# Seyyah — web sitesi (mavi mürekkep karakalem teması)

seyyah.info'nun yeni sürümü. Şu an yalnızca önizleme olarak yayında:
**https://terminyus.github.io/Seyyah/**. seyyah.info'daki canlı siteye dokunulmadı.

Build adımı yok: düz HTML/CSS/JS. Animasyonlar GSAP 3.12.5 + ScrollTrigger ile yapılıyor; iki dosya da
`assets/vendor/` altında, CDN'e bağımlılık yok. Yazı tipi olarak yalnızca el yazısı için Caveat Google
Fonts'tan yükleniyor. Başlıklar sistem fontuyla yazılıyor, uygulamayla aynı.

## Yapı

```
index.html                  ana sayfa (tüm bölümler)
gizlilik_politikasi/        yasal sayfalar (seyyah.info ile aynı URL yapısı)
kullanim_sartlari/
kvkk/
veri_silme/
assets/
  css/site.css              tema: tokenlar, bileşenler, yasal sayfa stilleri
  js/site.js                etkileşimler + kaydırma animasyonları
  js/places.js              öne çıkan 8 mekan (metin + Pexels atfı)
  img/turkiye.svg           81 il haritası (MIT, dnomak/svg-turkiye-haritasi)
  photos/*.webp             Pexels fotoğrafları (optimize edilmiş) + credits.json
  stickers/*.webp           uygulamadaki etiket görselleri
  vendor/                   gsap, ScrollTrigger
tools/
  build_legal.py            yasal sayfaları tools/legal-src'deki özgün metinlerden üretir
  build_map.py              harita kaynağından assets/img/turkiye.svg'yi üretir
  fetch_pexels.py           Pexels fotoğraflarını indirip webp'ye çevirir
  legal-src/                seyyah.info'dan alınan özgün yasal sayfalar (metin kaynağı)
PROMPTS.md                  üretilecek karakalem illüstrasyonların prompt'ları
```

Bütün yollar göreli. Bu yüzden site hem `/Seyyah/` alt yolunda hem de alan adının kökünde (seyyah.info)
değişiklik yapmadan çalışır.

## Yerelde çalıştırma

```bash
python3 -m http.server 8000
```

Sonra http://localhost:8000/ adresini açın. `fetch()` ile harita yüklendiği için sayfayı `file://` ile
değil, bir sunucu üzerinden açın.

## Fotoğrafları yenileme (Pexels)

Anahtar `.env` dosyasında durur ve `.gitignore` sayesinde repoya girmez. Anahtar istemci tarafında da
kullanılmaz; fotoğraflar önceden indirilir.

```bash
echo "PEXELS_API_KEY=..." > .env
python3 tools/fetch_pexels.py
```

Betik tanınabilir kişi içeren kareleri eler ve fotoğrafları 1200 px webp'ye çevirir. Fotoğrafçı atıfları
`assets/photos/credits.json` dosyasına yazılır. `places.js` bu dosyadaki atıflarla güncellenmelidir.

## Yasal sayfalar

Metinler değiştirilmez. Kaynak HTML `tools/legal-src/` altında, yeniden üretmek için:

```bash
python3 tools/build_legal.py
```

## Yayın (GitHub Pages)

`main` dalının kökünden yayınlanır (Settings → Pages → Deploy from a branch → `main` / root).
`main`'e yapılan her push birkaç dakika içinde yayına yansır.

## Canlıya (seyyah.info) geçerken

1. Tüm HTML dosyalarındaki `<meta name="robots" content="noindex, nofollow">` satırını kaldırın
   (`index.html` ve `tools/build_legal.py` içindeki şablon; ardından `build_legal.py`'yi çalıştırın).
2. Özel alan adı için repoya `CNAME` dosyası eklenir ve DNS ayarlanır. Bu iş onayla, ayrıca yapılacak.
3. `canonical` ve `og:url` zaten https://seyyah.info'yu gösteriyor.

## Erişilebilirlik ve hareket

- `prefers-reduced-motion` açıksa GSAP hiç başlatılmaz. Tüm içerik çizilmiş ve görünür halde gelir;
  canlı akış durur.
- Canlı akışta "Akışı durdur" düğmesi var. Akış, fare üzerindeyken ve görünür değilken de durur.
- Harita 81 ilin `<select>` listesiyle, öne çıkan mekanlar da düğmelerle klavyeden kullanılabilir.
