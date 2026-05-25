// ============ SVG NAMESPACE HELPER ============
const SVG_NS = 'http://www.w3.org/2000/svg';
// Append U+FE0E (text variation selector) so browsers render as text glyphs, not emoji.
const VS_TEXT = '\uFE0E';
const ZODIAC_GLYPHS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓']
  .map(g => g + VS_TEXT);

function el(name, attrs = {}, text = null) {
  const e = document.createElementNS(SVG_NS, name);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (text !== null) e.textContent = text;
  return e;
}

// ============ SHREE YANTRA PETALS (16 lines) ============
(function buildShreeYantraPetals() {
  const g = document.getElementById('sy-petals');
  if (!g) return;
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    const x1 = 100 + Math.cos(a) * 60;
    const y1 = 100 + Math.sin(a) * 60;
    const x2 = 100 + Math.cos(a) * 74;
    const y2 = 100 + Math.sin(a) * 74;
    g.appendChild(el('line', {
      x1, y1, x2, y2,
      stroke: 'url(#gold)',
      'stroke-width': '1'
    }));
  }
})();

// ============ BACKGROUND ZODIAC WHEEL ============
(function buildBgZodiac() {
  const spokes = document.getElementById('bg-spokes');
  const glyphs = document.getElementById('bg-glyphs');
  if (!spokes || !glyphs) return;
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    const x1 = 100 + Math.cos(a) * 54;
    const y1 = 100 + Math.sin(a) * 54;
    const x2 = 100 + Math.cos(a) * 96;
    const y2 = 100 + Math.sin(a) * 96;
    spokes.appendChild(el('line', {
      x1, y1, x2, y2, stroke: 'url(#bgz)', 'stroke-width': '0.5'
    }));
  }
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6 + Math.PI / 12;
    const x = 100 + Math.cos(a) * 86;
    const y = 100 + Math.sin(a) * 86;
    glyphs.appendChild(el('text', {
      x, y,
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
      'font-size': '9',
      'font-family': "'Noto Sans Symbols 2', serif",
      fill: '#e9b850'
    }, ZODIAC_GLYPHS[i]));
  }
})();

// ============ ZODIAC WHEEL (Leo center) - spokes + glyphs ============
(function buildZodiacWheel() {
  const spokes = document.getElementById('zw-spokes');
  const glyphs = document.getElementById('zw-glyphs');
  if (!spokes || !glyphs) return;
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6 - Math.PI / 2;
    const x1 = 100 + Math.cos(a) * 58;
    const y1 = 100 + Math.sin(a) * 58;
    const x2 = 100 + Math.cos(a) * 86;
    const y2 = 100 + Math.sin(a) * 86;
    spokes.appendChild(el('line', {
      x1, y1, x2, y2, stroke: 'url(#zg)', 'stroke-width': '0.8', opacity: '0.7'
    }));
  }
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6 - Math.PI / 2 + Math.PI / 12;
    const x = 100 + Math.cos(a) * 72;
    const y = 100 + Math.sin(a) * 72;
    glyphs.appendChild(el('text', {
      x, y,
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
      'font-size': '9',
      'font-family': "'Noto Sans Symbols 2', serif",
      fill: 'url(#zg)'
    }, ZODIAC_GLYPHS[i]));
  }
})();

// ============ SUN ZODIAC WHEEL (Daily Prediction card) ============
(function buildSunWheel() {
  const spokes = document.getElementById('sun-spokes');
  const glyphs = document.getElementById('sun-glyphs');
  const center = document.getElementById('sun-center');
  if (!spokes || !glyphs || !center) return;

  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6 - Math.PI / 2;
    const x1 = 100 + Math.cos(a) * 56;
    const y1 = 100 + Math.sin(a) * 56;
    const x2 = 100 + Math.cos(a) * 80;
    const y2 = 100 + Math.sin(a) * 80;
    spokes.appendChild(el('line', {
      x1, y1, x2, y2, stroke: 'url(#sg)', 'stroke-width': '0.7', opacity: '0.7'
    }));
  }
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6 - Math.PI / 2 + Math.PI / 12;
    const x = 100 + Math.cos(a) * 68;
    const y = 100 + Math.sin(a) * 68;
    glyphs.appendChild(el('text', {
      x, y,
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
      'font-size': '8',
      'font-family': "'Noto Sans Symbols 2', serif",
      fill: 'url(#sg)'
    }, ZODIAC_GLYPHS[i]));
  }

  // Sun center
  center.appendChild(el('circle', {
    cx: '100', cy: '100', r: '20', fill: 'url(#sg)'
  }));
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    const long = i % 2 === 0;
    const r1 = 24;
    const r2 = long ? 40 : 32;
    const x1 = 100 + Math.cos(a) * r1;
    const y1 = 100 + Math.sin(a) * r1;
    const x2 = 100 + Math.cos(a) * r2;
    const y2 = 100 + Math.sin(a) * r2;
    center.appendChild(el('line', {
      x1, y1, x2, y2,
      stroke: 'url(#sg)',
      'stroke-width': '2.6',
      'stroke-linecap': 'round'
    }));
  }
})();

// ============ BOTTOM NAV SUN RAYS ============
(function buildNavSunRays() {
  const g = document.getElementById('nav-sun-rays');
  if (!g) return;
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    const long = i % 2 === 0;
    const r1 = 24;
    const r2 = long ? 40 : 32;
    const x1 = 100 + Math.cos(a) * r1;
    const y1 = 100 + Math.sin(a) * r1;
    const x2 = 100 + Math.cos(a) * r2;
    const y2 = 100 + Math.sin(a) * r2;
    g.appendChild(el('line', {
      x1, y1, x2, y2,
      stroke: 'url(#navSg)',
      'stroke-width': '3',
      'stroke-linecap': 'round'
    }));
  }
})();

// ============ TWINKLING STARS ============
(function buildStars() {
  const wrap = document.getElementById('stars');
  if (!wrap) return;
  const stars = [
    { top: '8%', left: '32%', delay: '0s' },
    { top: '12%', left: '62%', delay: '0.3s' },
    { top: '18%', left: '82%', delay: '0.8s' },
    { top: '26%', left: '48%', delay: '1.2s' },
    { top: '44%', left: '92%', delay: '0.5s' },
    { top: '52%', left: '6%', delay: '1.5s' },
    { top: '62%', left: '70%', delay: '0.2s' },
    { top: '72%', left: '22%', delay: '1.0s' },
  ];
  stars.forEach(s => {
    const span = document.createElement('span');
    span.className = 'twinkle';
    span.style.top = s.top;
    span.style.left = s.left;
    span.style.animationDelay = s.delay;
    wrap.appendChild(span);
  });
})();

// ============ INTERACTIVE BOTTOM NAV (optional click to switch active) ============
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(n => {
      n.classList.remove('active');
      const ind = n.querySelector('.nav-indicator');
      if (ind) ind.remove();
    });
    item.classList.add('active');
    if (!item.querySelector('.nav-indicator')) {
      const ind = document.createElement('span');
      ind.className = 'nav-indicator';
      item.insertBefore(ind, item.firstChild);
    }
  });
});
