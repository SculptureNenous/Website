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
    <img src="Assets/Images/${dir}/${file}.jpg" alt="${medium}, № ${pad(no)}" width="${w}" height="${h}" loading="lazy">
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
let lastFocus;

function openBox(src, alt, caption) {
  lastFocus = document.activeElement;
  boxImg.src = src;
  boxImg.alt = alt;
  boxCap.textContent = caption;
  boxCap.hidden = !caption;
  box.hidden = false;
  requestAnimationFrame(() => box.classList.add('open'));
  box.querySelector('.lightbox-close').focus();
}

function closeBox() {
  box.classList.remove('open');
  setTimeout(() => { box.hidden = true; }, 350);
  lastFocus?.focus();
}

document.addEventListener('click', e => {
  const fig = e.target.closest('.frame, .photo');
  if (fig && !box.contains(fig)) {
    const img = fig.querySelector('img');
    openBox(img.src, img.alt, fig.dataset.caption || fig.querySelector('figcaption')?.textContent || '');
  } else if (e.target === box || e.target.closest('.lightbox-close')) {
    closeBox();
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !box.hidden) closeBox(); });
// Firefox ignores -webkit-user-drag, so stop images being dragged out here too
document.addEventListener('dragstart', e => { if (e.target.tagName === 'IMG') e.preventDefault(); });
