/* Seyyah — etkileşimler ve kaydırma animasyonları.
   GSAP yoksa ya da prefers-reduced-motion açıksa her şey animasyonsuz,
   tamamen görünür ve kullanılabilir kalır. */
(() => {
  'use strict';

  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const G = !RM && window.gsap && window.ScrollTrigger ? window.gsap : null;
  const root = document.documentElement;
  if (G) G.registerPlugin(window.ScrollTrigger);
  else root.classList.add('no-anim');

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs = {}) => {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  };
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- kalemle çizim yardımcıları ---------- */
  const prepDraw = (scope = document) => $$('[data-draw]', scope).forEach(p => p.setAttribute('pathLength', '1'));
  const drawPaths = (paths, opts = {}) => {
    if (!G || !paths.length) return null;
    return G.to(paths, {
      strokeDashoffset: 0, duration: opts.duration || 1.1, stagger: opts.stagger ?? 0.12,
      ease: 'power1.inOut', delay: opts.delay || 0,
      // Safari bazı şekillerde pathLength'i yok sayabiliyor; çizim bitince kesikli görünümü temizle
      onComplete: () => paths.forEach(p => { p.style.strokeDasharray = 'none'; })
    });
  };
  const drawOnScroll = (svg, opts = {}) => {
    if (!G) return;
    const paths = $$('[data-draw]', svg);
    ScrollTrigger.create({ trigger: svg, start: opts.start || 'top 85%', once: true, onEnter: () => drawPaths(paths, opts) });
  };
  prepDraw();

  /* ---------- üst menü ---------- */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const toggle = $('#navToggle');
  const menu = $('#mobileMenu');
  const setMenu = open => {
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
  };
  toggle.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); toggle.focus(); } });

  /* ---------- hero ---------- */
  if (G) {
    const tl = G.timeline({ delay: 0.2 });
    tl.fromTo('#writeRect', { attr: { width: 0 } }, { attr: { width: 480 }, duration: 2.1, ease: 'power1.inOut' })
      .add(drawPaths($$('.hero-svg [data-draw]').filter(p => !p.closest('mask')), { duration: 0.9, stagger: 0.15 }), 0.9)
      .add(drawPaths($$('.hero-svg mask [data-draw]'), { duration: 1.8, stagger: 0 }), 0.6)
      .from('.hero-pin', { y: -26, opacity: 0, duration: 0.7, stagger: 0.45, ease: 'bounce.out' }, 0.8)
      .from('.hero-polaroid', { y: 40, rotate: 14, opacity: 0, duration: 0.9, ease: 'back.out(1.6)' }, 0.5);
    $$('[data-count]').forEach(el => {
      const end = +el.dataset.count;
      const o = { v: 0 };
      G.to(o, { v: end, duration: 1.6, ease: 'power2.out', delay: 0.4, onUpdate: () => { el.textContent = Math.round(o.v); } });
    });
  }

  /* ---------- bölümler arası ayak izleri ---------- */
  $$('[data-trail]').forEach((svg, ti) => {
    const steps = 8;
    const flip = ti % 2 === 1;
    const g = svgEl('g');
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const x = 26 + t * 468;
      const y = 60 + Math.sin(t * Math.PI * 1.6 + ti) * 22;
      const dy = Math.cos(t * Math.PI * 1.6 + ti) * 22 * Math.PI * 1.6 / 468;
      const ang = Math.atan(dy) * 180 / Math.PI;
      const side = i % 2 ? 1 : -1;
      const cx = flip ? 520 - x : x;
      const rot = (flip ? -90 : 90) + (flip ? -ang : ang);
      const off = side * 13;
      const wrap = svgEl('g', { transform: `translate(${cx} ${y + off}) rotate(${rot})` });
      const use = svgEl('use', { href: (side > 0) !== flip ? '#foot-r' : '#foot-l', x: -13, y: -20, width: 26, height: 40 });
      wrap.appendChild(use);
      g.appendChild(wrap);
    }
    svg.appendChild(g);
    if (G) {
      G.fromTo($$('use', svg), { opacity: 0 }, {
        opacity: 1, stagger: 0.18, ease: 'none',
        scrollTrigger: { trigger: svg, start: 'top 92%', end: 'bottom 45%', scrub: 0.6 }
      });
    }
  });

  /* ---------- genel belirmeler ve çizimler ---------- */
  if (G) {
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 88%', once: true,
      onEnter: els => G.to(els, { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power2.out', clearProps: 'transform' })
    });
    $$('svg.draw').forEach(svg => {
      if (svg.classList.contains('hero-svg') || svg.id === 'annotSvg') return;
      drawOnScroll(svg);
    });
  }

  /* ---------- canlı akış ---------- */
  (() => {
    const stack = $('#liveStack');
    const pauseBtn = $('#livePause');
    const feed = [
      ['A', 'Ahmet', 'Kapadokya', "'da check-in yaptı", 'Göreme, Nevşehir'],
      ['E', 'Elif', 'Pamukkale', "'yi ziyaret etti", 'Denizli'],
      ['M', 'Mehmet', 'Mardin', "'i keşfetti", 'Eski Şehir'],
      ['Z', 'Zeynep', 'Kaş', "'ta Erken Kuş etiketini kazandı", 'Antalya'],
      ['B', 'Burak', 'Galata Kulesi', "'nde serisinin 14. gününe ulaştı", 'Beyoğlu, İstanbul'],
      ['S', 'Selin', 'Safranbolu Konakları', "'nın müdavimi oldu", 'Karabük'],
      ['C', 'Can', 'Uzungöl', "'e ulaştı", 'Çaykara, Trabzon'],
      ['D', 'Deniz', 'Nemrut Dağı', "'nda gün doğumunu yakaladı", 'Adıyaman'],
      ['E', 'Ece', 'Odunpazarı', "'nda Gün Batımı Avcısı oldu", 'Eskişehir']
    ];
    const agos = ['az önce', '1 dk önce', '3 dk önce'];
    let idx = 3;
    let paused = false;
    let visible = false;
    let hover = false;
    const fill = (note, item, ago) => {
      note.querySelector('.avatar').textContent = item[0];
      const p = note.querySelector('p');
      p.textContent = '';
      p.append(item[1] + ' ');
      const b = document.createElement('b');
      b.textContent = item[2];
      p.append(b, item[3]);
      note.querySelector('small').textContent = `${item[4]} · ${ago}`;
    };
    if (!G) return; // hareket yoksa üç not sabit kalır
    const tick = () => {
      if (paused || !visible || hover || document.hidden) return;
      const notes = $$('.live-note', stack);
      const first = notes[0];
      const tl = G.timeline();
      tl.to(first, { x: -60, opacity: 0, rotate: -8, duration: 0.45, ease: 'power2.in' })
        .to(notes.slice(1), { y: -108, duration: 0.55, ease: 'power2.inOut' }, 0.15)
        .add(() => {
          stack.appendChild(first);
          G.set(notes.slice(1), { clearProps: 'transform' });
          fill(first, feed[idx % feed.length], agos[0]);
          notes.slice(1).forEach((n, i) => { const s = n.querySelector('small'); s.textContent = s.textContent.replace(/·.*$/, '· ' + agos[2 - i]); });
          idx++;
          G.fromTo(first, { x: 40, y: 30, opacity: 0, rotate: 4 }, { x: 0, y: 0, opacity: 1, rotate: -0.6, duration: 0.6, ease: 'back.out(1.4)', clearProps: 'transform' });
        });
    };
    setInterval(tick, 3600);
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(stack);
    stack.addEventListener('pointerenter', () => { hover = true; });
    stack.addEventListener('pointerleave', () => { hover = false; });
    pauseBtn.addEventListener('click', () => {
      paused = !paused;
      pauseBtn.setAttribute('aria-pressed', String(paused));
      pauseBtn.textContent = paused ? '▶ Akışı sürdür' : '❚❚ Akışı durdur';
    });
  })();
  if (!G) { const b = $('#livePause'); if (b) b.hidden = true; }

  /* ---------- harita yükleyici (rota + keşfet ortak) ---------- */
  let mapPromise = null;
  const loadMap = () => mapPromise || (mapPromise = fetch('assets/img/turkiye.svg')
    .then(r => { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then(t => new DOMParser().parseFromString(t, 'image/svg+xml').documentElement));

  const centerOf = (path, fx = 0.5, fy = 0.5) => {
    const b = path.getBBox();
    return { x: b.x + b.width * fx, y: b.y + b.height * fy };
  };
  const pinShape = (x, y, s = 1, cls = '') => {
    const g = svgEl('g', { class: cls, transform: `translate(${x} ${y}) scale(${s})` });
    g.appendChild(svgEl('path', { class: 'pin-body', d: 'M0 0C-3-9-14-15-14-27a14 14 0 0 1 28 0C14-15 3-9 0 0Z' }));
    g.appendChild(svgEl('circle', { class: 'pin-dot', cx: 0, cy: -27, r: 5 }));
    return g;
  };

  /* ---------- hafta sonu rotası ---------- */
  const routeSvg = $('#routeMap svg');
  if (routeSvg) {
    const stamp = $('#routeStamp');
    if (G) G.set(stamp, { opacity: 0 });
    loadMap().then(src => {
      const base = $('.route-base', routeSvg);
      const g = src.querySelector('.iller').cloneNode(true);
      g.removeAttribute('class');
      g.classList.add('iller');
      $$('path', g).forEach(p => p.removeAttribute('id'));
      base.appendChild(g);
      const pick = n => g.querySelector(`[data-name="${n}"]`);
      const ist = pick('İstanbul'), esk = pick('Eskişehir'), nev = pick('Nevşehir');
      [ist, esk, nev].forEach(p => p && p.classList.add('on'));
      const A = centerOf(ist, 0.38, 0.6), B = centerOf(esk), C = centerOf(nev, 0.5, 0.45);
      const d = `M${A.x} ${A.y}Q${(A.x + B.x) / 2 + 40} ${(A.y + B.y) / 2 - 60} ${B.x} ${B.y}T${C.x} ${C.y}`;
      const draw = $('.route-draw', routeSvg);
      const defs = svgEl('defs');
      const mask = svgEl('mask', { id: 'route-mask', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: 1008, height: 528 });
      const reveal = svgEl('path', { d, fill: 'none', stroke: '#fff', 'stroke-width': 16, 'stroke-linecap': 'round', 'data-draw': '' });
      mask.appendChild(reveal);
      defs.appendChild(mask);
      routeSvg.insertBefore(defs, routeSvg.firstChild);
      const line = svgEl('path', { d, class: 'route-line', mask: 'url(#route-mask)' });
      draw.appendChild(line);
      const labels = [['İstanbul', A, -10, -48], ['Eskişehir', B, 18, 30], ['Kapadokya', C, 20, 34]];
      const pins = [], checks = [];
      labels.forEach(([name, P, lx, ly]) => {
        const pin = pinShape(P.x, P.y, 1.25, 'map-pin');
        pins.push(pin);
        draw.appendChild(pin);
        const t = svgEl('text', { x: P.x + lx, y: P.y + ly, 'font-family': 'Caveat, cursive', 'font-size': 40, 'font-weight': 700, fill: '#0e2a6b' });
        t.textContent = name;
        draw.appendChild(t);
        const ck = svgEl('g', { transform: `translate(${P.x + 26} ${P.y - 56})` });
        ck.appendChild(svgEl('circle', { r: 13, fill: '#1f4fbf' }));
        ck.appendChild(svgEl('path', { d: 'M-6 0l4 4.5 8-9', fill: 'none', stroke: '#fff', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
        checks.push(ck);
        draw.appendChild(ck);
      });
      prepDraw(routeSvg);
      if (!G) return;
      G.set(reveal, { strokeDasharray: '1 1.1', strokeDashoffset: 1.05 });
      G.set(pins, { opacity: 0, y: -30 });
      G.set(checks, { opacity: 0, scale: 0, transformOrigin: '50% 50%' });
      const tl = G.timeline({ scrollTrigger: { trigger: '#routeMap', start: 'top 75%', end: 'bottom 40%', scrub: 0.7 } });
      tl.to(pins[0], { opacity: 1, y: 0, duration: 0.4, ease: 'bounce.out' }, 0)
        .to(checks[0], { opacity: 1, scale: 1, duration: 0.3 }, 0.35)
        .to(reveal, { strokeDashoffset: 0.5, duration: 1.4, ease: 'none' }, 0.5)
        .to(pins[1], { opacity: 1, y: 0, duration: 0.4, ease: 'bounce.out' }, 1.8)
        .to(checks[1], { opacity: 1, scale: 1, duration: 0.3 }, 2.15)
        .to(reveal, { strokeDashoffset: 0, duration: 1.4, ease: 'none' }, 2.3)
        .to(pins[2], { opacity: 1, y: 0, duration: 0.4, ease: 'bounce.out' }, 3.6)
        .to(checks[2], { opacity: 1, scale: 1, duration: 0.3 }, 3.95)
        .fromTo(stamp, { opacity: 0, scale: 2.4, rotate: -40 }, { opacity: 1, scale: 1, rotate: -12, duration: 0.5, ease: 'back.out(2)' }, 4.2);
    }).catch(() => {});
  }

  /* ---------- check-in simülasyonu ---------- */
  (() => {
    const sim = $('#sim');
    if (!sim) return;
    const btn = $('#simBtn');
    const label = btn.querySelector('span');
    const status = $('#simStatus');
    const setStatus = (main, sub) => { status.textContent = main; const s = document.createElement('small'); s.textContent = sub; status.appendChild(s); };
    let timer = 0;
    btn.addEventListener('click', () => {
      const st = sim.dataset.state;
      if (st === 'idle') {
        sim.dataset.state = 'scan';
        btn.disabled = true;
        setStatus('Konumun doğrulanıyor...', 'GPS sinyali bekleniyor');
        timer = setTimeout(() => {
          sim.dataset.state = 'done';
          btn.disabled = false;
          setStatus('Buradasın! ✓', 'Konum doğrulandı · Check-in\'e hazırsın!');
          label.textContent = 'Check-in\'i Onayla';
          if (G) G.fromTo('.sim-check', { scale: 0, svgOrigin: '160 62' }, { scale: 1, duration: 0.5, ease: 'back.out(2.4)' });
          btn.focus();
        }, RM ? 500 : 2100);
      } else if (st === 'done') {
        sim.dataset.state = 'reward';
        label.textContent = 'HARİKA!';
        if (G) G.fromTo('#simReward img', { scale: 0.2, rotate: -25, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 0.8, ease: 'back.out(1.8)' });
      } else if (st === 'reward') {
        clearTimeout(timer);
        sim.dataset.state = 'idle';
        label.textContent = 'Buradayım';
        setStatus('Mekana 120 m uzaklıktasın', 'Check-in için konumunu doğrula.');
      }
    });
  })();

  /* ---------- mekan ekranı: el yazısı oklar ---------- */
  (() => {
    const stage = $('#phoneStage');
    const svg = $('#annotSvg');
    if (!stage || !svg) return;
    let drawn = false;
    const layout = () => {
      if (getComputedStyle(svg).display === 'none') return;
      const sr = stage.getBoundingClientRect();
      svg.setAttribute('viewBox', `0 0 ${sr.width} ${sr.height}`);
      svg.textContent = '';
      $$('.annot', stage).forEach(a => {
        const tgt = stage.querySelector(`[data-annot="${a.dataset.for}"]`);
        if (!tgt) return;
        const ar = a.getBoundingClientRect(), tr = tgt.getBoundingClientRect();
        const leftSide = ar.left - sr.left < sr.width / 2;
        const x1 = (leftSide ? ar.right + 6 : ar.left - 6) - sr.left;
        const y1 = ar.top + ar.height / 2 - sr.top;
        let x2, y2, cx2, cy2;
        if (a.dataset.anchor === 'top') { // ortadaki düğmelere yukarıdan in
          x2 = tr.left + tr.width / 2 - sr.left;
          y2 = tr.top - 3 - sr.top;
          cx2 = x2; cy2 = y2 - 70;
        } else {
          x2 = (leftSide ? tr.left - 4 : tr.right + 4) - sr.left;
          y2 = tr.top + tr.height / 2 - sr.top;
          cx2 = (x1 + x2) / 2; cy2 = y2 + 10;
        }
        const cx1 = x1 + (x2 - x1) * 0.45;
        const d = `M${x1} ${y1}C${cx1} ${y1 - 16} ${cx2} ${cy2} ${x2} ${y2}`;
        const ang = Math.atan2(y2 - cy2, x2 - cx2);
        const h = 9;
        const hx1 = x2 - h * Math.cos(ang - 0.5), hy1 = y2 - h * Math.sin(ang - 0.5);
        const hx2 = x2 - h * Math.cos(ang + 0.5), hy2 = y2 - h * Math.sin(ang + 0.5);
        const color = a.classList.contains('note-c') ? 'var(--note)' : a.classList.contains('fav-c') ? 'var(--fav)' : 'var(--ink)';
        const body = svgEl('path', { d, class: 'ink', style: `stroke:${color}`, 'stroke-width': 1.8, 'data-draw': '' });
        const head = svgEl('path', { d: `M${hx1} ${hy1}L${x2} ${y2}L${hx2} ${hy2}`, class: 'ink', style: `stroke:${color}`, 'stroke-width': 1.8, 'data-draw': '' });
        svg.append(body, head);
      });
      prepDraw(svg);
      if (drawn || !G) $$('[data-draw]', svg).forEach(p => { p.style.strokeDasharray = 'none'; p.style.strokeDashoffset = '0'; });
    };
    const ready = () => {
      layout();
      if (!G) return;
      const notes = $$('.annot', stage);
      G.set(notes, { opacity: 0, y: 8 });
      ScrollTrigger.create({
        trigger: stage, start: 'top 65%', once: true,
        onEnter: () => {
          drawn = true;
          const paths = $$('[data-draw]', svg);
          notes.forEach((n, i) => {
            G.to(n, { opacity: 1, y: 0, duration: 0.5, delay: i * 0.45 });
            const pair = paths.slice(i * 2, i * 2 + 2);
            drawPaths(pair, { duration: 0.6, stagger: 0.5, delay: i * 0.45 + 0.2 });
          });
        }
      });
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(ready); else ready();
    let rt = 0;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { drawn = drawn || !G; layout(); }, 150); });
  })();

  /* ---------- etiket defteri ---------- */
  (() => {
    const grid = $('#stickerGrid');
    const detail = $('#stickerDetail');
    if (!grid) return;
    const rarityName = { common: 'Yaygın', rare: 'Nadir', epic: 'Efsane' };
    grid.addEventListener('click', e => {
      const b = e.target.closest('.sticker');
      if (!b) return;
      const was = b.getAttribute('aria-expanded') === 'true';
      $$('.sticker', grid).forEach(s => s.setAttribute('aria-expanded', 'false'));
      if (was) return;
      b.setAttribute('aria-expanded', 'true');
      detail.textContent = '';
      const h = document.createElement('h3');
      h.textContent = b.querySelector('h3').textContent;
      const p = document.createElement('p');
      p.textContent = `${rarityName[b.dataset.rarity]} · ${b.dataset.desc}`;
      detail.append(h, p);
      if (G) G.fromTo(detail, { rotate: -1.5, y: 8, opacity: 0.4 }, { rotate: 0, y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' });
    });
    if (G) {
      G.from($$('.sticker', grid), {
        opacity: 0, y: -26, rotate: () => G.utils.random(-18, 18), scale: 1.12,
        duration: 0.6, stagger: 0.09, ease: 'back.out(1.6)', clearProps: 'transform,opacity',
        scrollTrigger: { trigger: grid, start: 'top 80%', once: true }
      });
    }
  })();

  /* ---------- günlük seri takvimi ---------- */
  (() => {
    const cal = $('#cal');
    if (!cal) return;
    ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].forEach(d => {
      const s = document.createElement('span');
      s.className = 'dow';
      s.textContent = d;
      cal.appendChild(s);
    });
    const checked = new Set([0, 2, 3, 5, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20]);
    const freeze = 13, today = 20;
    for (let i = 0; i < 28; i++) {
      const c = document.createElement('div');
      c.className = 'day';
      if (i === today) c.classList.add('today');
      if (i === freeze) { c.classList.add('freeze'); c.innerHTML = '<span>🧊</span>'; }
      else if (checked.has(i)) {
        const s = svgEl('svg', { viewBox: '0 0 20 20', class: 'draw' });
        s.appendChild(svgEl('path', { class: 'ink', d: 'M4 4.5c4 3.6 8 7.4 12 11', 'stroke-width': 2.4, 'data-draw': '' }));
        s.appendChild(svgEl('path', { class: 'ink', d: 'M15.5 4c-3.8 4-7.6 7.6-11.4 12', 'stroke-width': 2.4, 'data-draw': '' }));
        c.appendChild(s);
      } else if (i > today) c.style.opacity = '0.55';
      cal.appendChild(c);
    }
    prepDraw(cal);
    if (!G) return;
    const num = $('#streakNum');
    ScrollTrigger.create({
      trigger: cal, start: 'top 80%', once: true,
      onEnter: () => {
        drawPaths($$('[data-draw]', cal), { duration: 0.18, stagger: 0.05 });
        const o = { v: 0 };
        G.to(o, { v: 14, duration: 2, ease: 'power1.out', onUpdate: () => { num.textContent = Math.round(o.v); } });
      }
    });
  })();

  /* ---------- türkiye haritası + mekan kartı ---------- */
  (() => {
    const host = $('#trMap');
    if (!host) return;
    const places = window.SEYYAH_PLACES || [];
    const readout = $('#mapReadout');
    const select = $('#ilSelect');
    const chips = $('#placeChips');
    const cmp = $('#compare');
    const range = $('#cmpRange');
    let pinEls = {};
    let provinces = [];

    // karşılaştırma kaydırıcısı
    const setPos = v => cmp.style.setProperty('--pos', v + '%');
    range.addEventListener('input', () => setPos(range.value));
    if (finePointer) {
      cmp.addEventListener('pointermove', e => {
        const r = cmp.getBoundingClientRect();
        const v = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
        range.value = v;
        setPos(v);
      });
    }

    const showPlace = (p, focusCard) => {
      if (!p) return;
      $('#cmpPhoto').src = p.photo;
      $('#cmpPhoto').alt = `${p.name}, ${p.where} — gerçek fotoğraf`;
      $('#cmpSketch').src = p.photo;
      $('#pcTitle').textContent = p.name;
      $('#pcWhere').textContent = p.where;
      $('#pcText').textContent = p.text;
      const cr = $('#pcCredit');
      cr.textContent = 'Fotoğraf: ';
      const a = document.createElement('a');
      a.href = p.credit.url; a.rel = 'noopener'; a.textContent = p.credit.photographer;
      cr.append(a, ' / Pexels');
      $$('.chip-btn', chips).forEach(c => c.setAttribute('aria-pressed', String(c.dataset.slug === p.slug)));
      Object.entries(pinEls).forEach(([s, el]) => el.classList.toggle('active', s === p.slug));
      if (G) {
        G.fromTo('#placeCard', { opacity: 0.35, y: 10 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', clearProps: 'transform' });
        const o = { v: 15 };
        G.to(o, { v: 50, duration: 0.9, ease: 'power2.out', onUpdate: () => { setPos(o.v); range.value = o.v; } });
      }
      if (focusCard && innerWidth < 1000) $('#placeCard').scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'nearest' });
    };

    places.forEach(p => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip-btn'; b.dataset.slug = p.slug;
      b.setAttribute('aria-pressed', 'false');
      b.textContent = p.name;
      b.addEventListener('click', () => showPlace(p, true));
      li.appendChild(b);
      chips.appendChild(li);
    });
    const credits = $('#creditList');
    places.forEach(p => {
      const li = document.createElement('li');
      li.append(`${p.name}: `);
      const a = document.createElement('a');
      a.href = p.credit.url; a.rel = 'noopener'; a.textContent = p.credit.photographer;
      li.append(a, ' / Pexels');
      credits.appendChild(li);
    });
    showPlace(places[0]);

    const highlight = (path, sticky) => {
      if (!path) return;
      provinces.forEach(p => p.classList.toggle('active', p === path));
      if (sticky) path.classList.add('visited');
      readout.textContent = `${path.dataset.name} · ${path.dataset.plate}`;
    };

    loadMap().then(src => {
      const svg = src.cloneNode(true);
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', 'Türkiye\'nin 81 ilini gösteren karakalem harita');
      host.textContent = '';
      host.appendChild(svg);
      provinces = $$('.iller path', svg);
      provinces.forEach(p => p.setAttribute('aria-hidden', 'true'));
      // il listesi (klavye ve ekran okuyucu için)
      provinces.slice().sort((a, b) => a.dataset.name.localeCompare(b.dataset.name, 'tr')).forEach(p => {
        const o = document.createElement('option');
        o.value = p.id; o.textContent = `${p.dataset.name} (${p.dataset.plate})`;
        select.appendChild(o);
      });
      select.addEventListener('change', () => {
        const p = svg.getElementById(select.value);
        if (!p) return;
        highlight(p, true);
        const pl = places.find(x => 'il-' + x.il === p.id);
        if (pl) showPlace(pl);
      });
      svg.addEventListener('pointerover', e => {
        const p = e.target.closest('.iller path');
        if (p && finePointer) readout.textContent = `${p.dataset.name} · ${p.dataset.plate}`;
      });
      svg.addEventListener('click', e => {
        const pin = e.target.closest('.map-pin');
        if (pin) return;
        const p = e.target.closest('.iller path');
        if (!p) return;
        highlight(p, true);
        select.value = p.id;
        const pl = places.find(x => 'il-' + x.il === p.id);
        if (pl) showPlace(pl, true);
      });
      // öne çıkan mekan pinleri
      const layer = svgEl('g', { class: 'pins' });
      places.forEach(pl => {
        const prov = svg.getElementById('il-' + pl.il);
        if (!prov) return;
        const c = centerOf(prov, pl.fx, pl.fy);
        const pin = pinShape(c.x, c.y, 0.95, 'map-pin');
        pin.dataset.x = c.x; pin.dataset.y = c.y;
        // görünmez, geniş dokunma alanı
        pin.insertBefore(svgEl('circle', { class: 'pin-hit', cx: 0, cy: -22, r: 24, fill: 'transparent' }), pin.firstChild);
        pin.setAttribute('tabindex', '0');
        pin.setAttribute('role', 'button');
        pin.setAttribute('aria-label', `${pl.name}, ${pl.where}`);
        const act = () => { highlight(prov, true); select.value = prov.id; showPlace(pl, true); };
        pin.addEventListener('click', act);
        pin.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
        pinEls[pl.slug] = pin;
        layer.appendChild(pin);
      });
      svg.appendChild(layer);
      // pinleri ekranda ~28 px yükseklikte tut (mobilde harita küçülünce pin de küçülmesin)
      const sizePins = () => {
        const k = svg.getBoundingClientRect().width / 1007;
        if (!k) return;
        const sc = Math.max(0.95, 28 / (41 * k));
        $$('.map-pin', layer).forEach(g => g.setAttribute('transform', `translate(${g.dataset.x} ${g.dataset.y}) scale(${sc.toFixed(2)})`));
      };
      sizePins();
      addEventListener('resize', sizePins);
      showPlace(places[0]);
      if (G) {
        G.from(provinces, { opacity: 0, duration: 0.5, stagger: { each: 0.012, from: 'random' }, scrollTrigger: { trigger: host, start: 'top 80%', once: true } });
        G.from($$('.pin-body, .pin-dot', layer), { y: -40, opacity: 0, duration: 0.6, stagger: 0.06, ease: 'bounce.out', delay: 0.6, scrollTrigger: { trigger: host, start: 'top 80%', once: true } });
      }
    }).catch(() => { host.innerHTML = '<p class="map-fallback">Harita yüklenemedi. Öne çıkan mekanları aşağıdaki düğmelerden seçebilirsin.</p>'; });
  })();

  /* ---------- imleç yakınında hafif mürekkep izi (yalnızca masaüstü) ---------- */
  if (finePointer && !RM) {
    const cv = document.createElement('canvas');
    cv.className = 'ink-trail';
    cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    let pts = [], raf = 0;
    const size = () => { const r = devicePixelRatio || 1; cv.width = innerWidth * r; cv.height = innerHeight * r; ctx.setTransform(r, 0, 0, r, 0, 0); };
    size();
    addEventListener('resize', size);
    const LIFE = 420;
    const loop = () => {
      const now = performance.now();
      pts = pts.filter(p => now - p.t < LIFE);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.lineCap = 'round';
      for (let i = 1; i < pts.length; i++) {
        const a = 1 - (now - pts[i].t) / LIFE;
        ctx.strokeStyle = `rgba(31,79,191,${(a * 0.32).toFixed(3)})`;
        ctx.lineWidth = 0.6 + a * 1.4;
        ctx.beginPath();
        ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
        ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
      }
      raf = pts.length ? requestAnimationFrame(loop) : 0;
    };
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      pts.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
  }
})();
