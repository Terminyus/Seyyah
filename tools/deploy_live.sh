#!/usr/bin/env bash
# Seyyah web sitesini seyyah.info'ya (sunucudaki /var/www/seyyah) yayınlar.
#
#   tools/deploy_live.sh            # yedek al → dosyaları yükle → canlıda doğrula
#   tools/deploy_live.sh --rollback <ZAMAN_DAMGASI>   # o yedeğe geri dön
#
# Yalnızca sitenin kendi dosyalarına dokunur: index.html, yasal sayfalar (klasör + .html),
# assets/ altındaki site dosyaları. /api, /admin, seyyah_service, robots.txt ve sunucudaki
# başka hiçbir dosya silinmez veya değiştirilmez. Yedek: /var/backups/seyyah-site/<zaman>/
set -euo pipefail

KEY="${SEYYAH_SSH_KEY:-$HOME/.ssh/seyyah_new}"
SERVER="${SEYYAH_SERVER:-ubuntu@92.5.24.85}"
SITE="/var/www/seyyah"
HERE="$(cd "$(dirname "$0")/.." && pwd)"
SSH=(ssh -i "$KEY" -o BatchMode=yes -o IdentitiesOnly=yes "$SERVER")
FILES=(index.html gizlilik_politikasi kullanim_sartlari kvkk veri_silme
       gizlilik_politikasi.html kullanim_sartlari.html kvkk.html veri_silme.html assets)

if [[ "${1:-}" == "--rollback" ]]; then
  TS="${2:?yedek zaman damgası gerekli (ör. 20261030-201500)}"
  echo "==> Geri alınıyor: /var/backups/seyyah-site/$TS"
  "${SSH[@]}" "sudo bash -s" <<EOF
set -euo pipefail
BK=/var/backups/seyyah-site/$TS
test -f "\$BK/site-before.tgz"
# yeni sürümün eklediği ama eskide olmayan yollar
while read -r p; do rm -rf "$SITE/\$p"; done < "\$BK/added.txt"
tar -C "$SITE" -xzf "\$BK/site-before.tgz"
echo "  · geri alındı"
EOF
  exit 0
fi

TS="$(date +%Y%m%d-%H%M%S)"
cd "$HERE"
echo "==> Yerel denetim"
grep -l 'name="robots" content="noindex' index.html ./*/index.html ./*.html 2>/dev/null && { echo "noindex satırı duruyor, canlıya çıkılmaz"; exit 1; }
for f in "${FILES[@]}"; do [[ -e "$f" ]] || { echo "eksik: $f"; exit 1; }; done

echo "==> Paket hazırlanıyor"
PKG="$(mktemp -d)/seyyah-site-$TS.tgz"
COPYFILE_DISABLE=1 tar --no-mac-metadata --no-xattrs --exclude='._*' --exclude='.DS_Store' -czf "$PKG" "${FILES[@]}"
scp -i "$KEY" -o BatchMode=yes -o IdentitiesOnly=yes -q "$PKG" "$SERVER:/tmp/seyyah-site-$TS.tgz"

echo "==> Sunucuda yedek + kurulum"
"${SSH[@]}" "sudo bash -s" <<EOF
set -euo pipefail
PKG=/tmp/seyyah-site-$TS.tgz
BK=/var/backups/seyyah-site/$TS
mkdir -p "\$BK"
cd "$SITE"
# yalnızca üzerine yazılacak yolların yedeği
EXIST=(); : > "\$BK/added.txt"
for p in \$(tar -tzf "\$PKG" | sed 's#/\$##' | awk -F/ '{print \$1 (NF>1 ? "/" \$2 : "")}' | sort -u); do
  if [[ -e "\$p" ]]; then EXIST+=("\$p"); else echo "\$p" >> "\$BK/added.txt"; fi
done
tar -czf "\$BK/site-before.tgz" "\${EXIST[@]}" 2>/dev/null || tar -czf "\$BK/site-before.tgz" --files-from /dev/null
chmod -R go-rwx "\$BK"
tar -C "$SITE" --no-same-owner -xzf "\$PKG"
for f in \$(tar -tzf "\$PKG" | awk -F/ '{print \$1}' | sort -u); do
  chown -R www-data:www-data "$SITE/\$f"
  find "$SITE/\$f" -type d -exec chmod 755 {} +
  find "$SITE/\$f" -type f -exec chmod 644 {} +
done
rm -f "\$PKG"
echo "  · yedek: \$BK"
EOF
rm -f "$PKG"

echo "==> Canlı doğrulama"
fail=0
for path in / /gizlilik_politikasi /kullanim_sartlari /kvkk /veri_silme /gizlilik_politikasi/ /assets/css/site.css /assets/img/turkiye.svg /api/v1/health; do
  code=$(curl -s -o /dev/null -w '%{http_code}' -L "https://seyyah.info$path?d=$TS")
  printf '  %-28s %s\n' "$path" "$code"
  [[ "$code" == 200 ]] || fail=1
done
# Not: pipefail açıkken `curl | grep -q` yanlış alarm verir (grep erken çıkınca curl SIGPIPE alır); önce gövdeyi al.
home="$(curl -s "https://seyyah.info/?d=$TS")"
legal="$(curl -s -L "https://seyyah.info/veri_silme?d=$TS")"
[[ "$home" == *'Haftada bir check-in'* ]] || { echo "  ! ana sayfa yeni sürüm değil"; fail=1; }
[[ "$legal" == *'logo-yazi.png'* ]] || { echo "  ! /veri_silme yeni temada değil (nginx eski .html'i sunuyor olabilir)"; fail=1; }
if [[ $fail == 1 ]]; then
  echo "==> Doğrulama BAŞARISIZ. Geri almak için:  tools/deploy_live.sh --rollback $TS"
  exit 1
fi
echo "==> Tamam. Geri alma gerekirse: tools/deploy_live.sh --rollback $TS"
