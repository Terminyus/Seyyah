"""dnomak/svg-turkiye-haritasi (MIT) -> assets/img/turkiye.svg  (python3 tools/build_map.py tools/cache/tr_map.html assets/img/turkiye.svg) (81 il, sade path'ler)."""
import re, sys
src, out = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
s = s[s.index('<g id="turkiye">'):]
num = re.compile(r'-?\d*\.\d+|-?\d+')
def rnd(d):
    return num.sub(lambda m: ('%.1f' % float(m.group())).rstrip('0').rstrip('.'), d)
parts = []
for m in re.finditer(r'<g id="([^"]+)" data-plakakodu="(\d+)"[^>]*data-iladi="([^"]+)">(.*?)</g>', s, re.S):
    gid, plate, name, body = m.groups()
    ds = re.findall(r'\sd="([^"]+)"', body)
    polys = re.findall(r'points="([^"]+)"', body)
    ds += ['M' + p.strip() + 'z' for p in polys]
    if not ds or gid == 'kuzey-kibris': continue
    if gid.startswith('istanbul'):
        gid, name = 'istanbul', 'İstanbul'
        prev = next((x for x in parts if 'id="il-istanbul"' in x), None)
        if prev:
            parts.remove(prev); ds = [re.search(r' d="([^"]+)"', prev).group(1)] + ds
    d = ' '.join(rnd(x) for x in ds)
    parts.append(f'<path id="il-{gid}" data-plate="{plate}" data-name="{name}" d="{d}"/>')
print(len(parts), 'il')
open(out, 'w', encoding='utf-8').write(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1007.478 527.323">\n'
  '<!-- Kaynak: github.com/dnomak/svg-turkiye-haritasi (MIT, © Doğukan Güven Nomak) -->\n'
  '<g class="iller">' + ''.join(parts) + '</g></svg>\n')
