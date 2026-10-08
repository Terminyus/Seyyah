# Üretilecek karakalem illüstrasyonlar

Sitede şu an bu görsellerin yerinde **yer tutucu** var: Pexels fotoğrafı CSS ile mavi mürekkep tonuna
çevriliyor (`.sketch` sınıfı). Gerçek çizimler gelince aşağıdaki dosya adlarıyla `assets/sketches/`
klasörüne koyun; sonra ilgili `<img>` yolunu değiştirip kapsayıcıya `is-drawing` sınıfını ekleyin
(bu sınıf mürekkep filtresini kapatır, çizim olduğu gibi görünür).

## Ortak stil (her prompt'un başına ekleyin)

```
White paper, blue ballpoint pen sketch, cross-hatching, no color fill, white background.
Single ink color: ballpoint blue (#1F4FBF), varying pressure, loose confident lines,
light hatching for shadows, slight wobble like hand drawing, no text, no signature,
no people's faces in close-up, no frame, no paper texture shadows.
```

Format: **webp**, yatay görseller 1600×1067 (3:2), kare olanlar 1200×1200. Arka plan saf beyaz olsun
(sayfa zemini #FAF8F3 ile karışabilmesi için `mix-blend-mode: multiply` kullanılacak).

| Dosya | Kullanıldığı yer | Prompt (ortak stilden sonra) |
|---|---|---|
| `galata.webp` (kare) | Hero polaroid + telefon mockup'ı | Galata Tower in Istanbul seen from a narrow Beyoğlu street, old apartment buildings and a street lamp in the foreground, morning light, tower centered. |
| `kapadokya.webp` | Keşfet kartı | Cappadocia at sunrise, hot air balloons floating over fairy chimneys and Göreme valley, layered rock formations in the foreground. |
| `pamukkale.webp` | Keşfet kartı | Pamukkale travertine terraces with shallow water pools, step-like white formations descending toward the valley, a few Hierapolis ruins on top. |
| `nemrut.webp` | Keşfet kartı | Giant stone heads on Mount Nemrut at dawn, broken statues on the terrace, the stone tumulus behind them. |
| `kas.webp` | Keşfet kartı | Kaş harbor on the Mediterranean, small boats, whitewashed houses on the hillside, Meis island on the horizon. |
| `mardin.webp` | Keşfet kartı | Mardin old town, stacked stone houses with arched windows on a hillside, minaret, overlooking the Mesopotamian plain. |
| `safranbolu.webp` | Keşfet kartı | Traditional Ottoman timber houses of Safranbolu with bay windows (cumba), tiled roofs, narrow cobblestone street. |
| `uzungol.webp` | Keşfet kartı | Uzungöl lake in the misty Black Sea mountains, a mosque with a tall minaret on the shore, pine forests, reflections on the water. |
| `cay-masa.webp` (kare) | (isteğe bağlı) Canlı akış / SSS süsü | A Turkish tea glass (ince belli bardak) on a saucer on a small café table, a folded map and a phone beside it, top-down three-quarter view. |
| `hero-sahne.webp` | (isteğe bağlı) Hero arka planı | An open travel notebook on a table with a hand-drawn route between pins, a Turkish tea glass, a few loose photos; drawn as a single ink sketch. |
| `odunpazari.webp` | (isteğe bağlı) Rota bölümü 2. durak | Colorful Ottoman-era houses of Odunpazarı, Eskişehir, with overhanging upper floors on a sloping street. |

Not: Kişilerin yüzleri çizimlerde tanınabilir olmasın; Pexels yer tutucularında da insan içeren kareler
filtrelendi.
