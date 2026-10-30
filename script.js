// Catalogue: [file, catalogue number, medium, width, height]. Numbers follow the original site's ledger.
// Width/height reserve each image's space before it loads, so nothing shifts while scrolling.
const paintingSizes = [
  [1516, 2048], [1179, 912], [746, 1280], [1524, 2048], [1842, 2048], [1284, 1947], [1522, 2048],
  [1543, 1831], [1486, 2048], [1718, 2048], [2048, 1680], [1532, 2048], [500, 360], [1486, 2048],
  [1448, 2048], [1440, 1800], [1700, 2048], [1440, 1086], [860, 960], [1848, 2048], [1440, 1800],
  [1540, 2048], [1628, 2048], [1638, 2048], [2048, 1494], [2048, 1536], [1284, 1737], [1280, 1804],
];
const works = {
  sculpture: {
    dir: 'Statues',
    items: [
      ['Statue-2', 5, 'Bronze', 1086, 1448], ['Statue-1', 4, 'Bronze', 848, 1254],
      ['Statue-3', 6, 'Cast Relief', 1600, 926], ['Statue-4', 7, 'Cast Relief', 1000, 1573],
      ['Statue-5', 8, 'Cast Relief', 832, 1261], ['Statue-6', 23, 'Cast Relief', 1536, 2048],
      ['Statue-7', 24, 'Cast Relief', 1284, 1782], ['Statue-8', 25, 'Bronze', 2048, 1536],
      ['Statue-9', 26, 'Sculpture', 1424, 2048], ['Statue-10', 27, 'Bronze', 720, 960],
      ['Statue-11', 28, 'Clay', 1500, 2048],
    ],
  },
  painting: {
    dir: 'Paintings',
    // painting-1..28 are catalogued №09..№22 and №29..№42
    items: paintingSizes.map(([w, h], i) => [`painting-${i + 1}`, i < 14 ? i + 9 : i + 15, 'Painting', w, h]),
  },
};

const pad = n => String(n).padStart(2, '0');
const card = (dir, [file, no, medium, w, h]) => `
  <figure class="frame reveal">
    <img src="Assets/Web/${dir}/${file}.jpg" alt="${medium}, № ${pad(no)}" width="${w}" height="${h}" loading="lazy">
    <figcaption>№ ${pad(no)} · ${medium}</figcaption>
  </figure>`;

// Two fixed columns (first half left, as in the original) instead of CSS columns,
// which re-balance and swap works between columns as lazy images load.
for (const [name, { dir, items }] of Object.entries(works)) {
  const half = Math.floor(items.length / 2);
  document.querySelector(`[data-gallery="${name}"]`).innerHTML = [items.slice(0, half), items.slice(half)]
    .map(col => `<div class="gallery-col">${col.map(item => card(dir, item)).join('')}</div>`).join('');
}

// Fade sections in as they scroll into view
const observer = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); observer.unobserve(e.target); }
}, { rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Lightbox
const box = document.querySelector('.lightbox');
const boxImg = box.querySelector('img');
const boxCap = box.querySelector('figcaption');
const prevBtn = box.querySelector('.lightbox-prev');
const nextBtn = box.querySelector('.lightbox-next');
const behind = document.querySelectorAll('body > header, main, body > footer');
const viewable = 'main .frame, main .photo';
let group = [], index = 0, lastFocus;

// Every photo that opens the viewer can also be reached with Tab and opened with Enter or Space
document.querySelectorAll(viewable).forEach(fig => {
  fig.tabIndex = 0;
  fig.setAttribute('role', 'button');
  fig.setAttribute('aria-label', `View larger: ${fig.querySelector('img').alt}`);
});

// Galleries and the journal are built as columns, so their code order runs down each column.
// Read them row by row instead (left, right, next row) while the columns sit side by side.
function readingOrder(set) {
  const cols = [...set.querySelectorAll('.gallery-col, .entry')];
  const items = cols.map(col => [...col.querySelectorAll('.frame, .photo')]);
  if (cols.length < 2 || cols[0].offsetTop !== cols[1].offsetTop) return items.flat(); // stacked on phones
  const rows = [];
  for (let r = 0; r < Math.max(...items.map(c => c.length)); r++) items.forEach(c => c[r] && rows.push(c[r]));
  return rows;
}

// Page Tab order, with each gallery and the journal swapped into reading order
function tabOrder() {
  const list = [...document.querySelectorAll('a[href], button, [tabindex="0"]')]
    .filter(el => !el.closest('[inert], [hidden]') && el.getClientRects().length);
  document.querySelectorAll('[data-gallery], .journal').forEach(set => {
    const slots = list.flatMap((el, i) => (set.contains(el) ? [i] : []));
    readingOrder(set).forEach((el, k) => { list[slots[k]] = el; });
  });
  return list;
}

function show(i) {
  index = (i + group.length) % group.length;
  const fig = group[index];
  const img = fig.querySelector('img');
  boxImg.src = img.src.replace('/Assets/Web/', '/Assets/Images/'); // full-size original
  boxImg.alt = img.alt;
  boxCap.textContent = fig.dataset.caption || fig.querySelector('figcaption')?.textContent || '';
  boxCap.hidden = !boxCap.textContent;
}

function openBox(fig) {
  lastFocus = fig;
  // Step through the photos of the same gallery or journal; others open on their own
  const set = fig.closest('[data-gallery], .journal');
  group = set ? readingOrder(set) : [fig];
  prevBtn.hidden = nextBtn.hidden = group.length < 2;
  show(group.indexOf(fig));
  behind.forEach(el => { el.inert = true; }); // keeps Tab inside the viewer
  box.hidden = false;
  requestAnimationFrame(() => box.classList.add('open'));
  box.querySelector('.lightbox-close').focus();
}

function closeBox() {
  box.classList.remove('open');
  behind.forEach(el => { el.inert = false; });
  setTimeout(() => { box.hidden = true; }, 350);
  lastFocus?.focus();
}

document.addEventListener('click', e => {
  const fig = e.target.closest(viewable);
  if (fig) openBox(fig);
  else if (e.target.closest('.lightbox-prev')) show(index - 1);
  else if (e.target.closest('.lightbox-next')) show(index + 1);
  else if (e.target === box || e.target.closest('.lightbox-close')) closeBox();
});

document.addEventListener('keydown', e => {
  if (box.hidden) {
    const fig = e.target.closest?.(viewable);
    if (fig && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openBox(fig); }
    if (e.key === 'Tab') {
      const list = tabOrder();
      const i = list.indexOf(document.activeElement);
      const next = i < 0 ? null : list[i + (e.shiftKey ? -1 : 1)];
      if (next) { e.preventDefault(); next.focus(); } // past either end, let the browser take over
    }
  } else if (e.key === 'Escape') closeBox();
  else if (e.key === 'ArrowLeft' && group.length > 1) show(index - 1);
  else if (e.key === 'ArrowRight' && group.length > 1) show(index + 1);
});

// Swipe left or right on phones
let touchX = null;
box.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
box.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchX;
  if (group.length > 1 && Math.abs(dx) > 50) show(dx < 0 ? index + 1 : index - 1);
  touchX = null;
});
// Firefox ignores -webkit-user-drag, so stop images being dragged out here too
document.addEventListener('dragstart', e => { if (e.target.tagName === 'IMG') e.preventDefault(); });
