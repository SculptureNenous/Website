// Catalogue: [file, catalogue number, medium, width, height]. Numbers follow the original site's ledger.
// Width/height reserve each image's space before it loads, so nothing shifts while scrolling.
const paintingSizes = [
  [1516, 2048], [1179, 912], [746, 1280], [1524, 2048], [1842, 2048], [1284, 1947], [1522, 2048],
  [1543, 1831], [1486, 2048], [1718, 2048], [2048, 1680], [1532, 2048], null /* painting-13 (№21) removed */, [1486, 2048],
  [1448, 2048], [1440, 1800], [1700, 2048], [1440, 1086], [860, 960], [1848, 2048], [1440, 1800],
  [1540, 2048], [1628, 2048], [1638, 2048], [2048, 1494], [2048, 1536], [1284, 1737], [1280, 1804],
];
// Titles and details from Nenous's own Facebook posts, keyed by painting file number.
// Paintings missing here keep the plain "Painting" caption until their titles are known.
const paintingDetails = {
  1: { title: 'New Birth', size: '120.9 × 90.4 cm' },
  2: { title: 'Oil Painting', size: '50 × 60 cm', year: 2022 },
  3: { title: "Dante's Inferno", year: 2020 },
  4: { title: 'Colorful Moons', size: '100 × 80 cm' },
  5: { title: 'Cultural Heritage', size: '100 × 90 cm' },
  6: { title: 'Behind the Curtain', medium: 'Oil on canvas' },
  7: { medium: 'Oil', year: 2022 },
  8: { title: 'Remnants of a Homeland', medium: 'Oil on canvas', size: '180 × 150 cm' },
  9: { title: 'Assyrian Moon', size: '100 × 80 cm' },
  10: { title: 'Will of the People', medium: 'Acrylic', size: '100 × 120 cm', year: 2020 },
  11: { title: 'Bakhdida Wedding', year: 2023 },
  12: { title: 'Tree of Life' },
  14: { title: 'Oil Painting', size: '100 × 80 cm', year: 2022 },
  15: { title: 'Migratory Bird', size: '70 × 50 cm' },
  16: { title: 'The Compass', medium: 'Oil', year: 2024 },
  17: { title: 'When the Soul Embraces the Sun', size: '80 × 60 cm' },
  18: { year: 2022 },
  19: { title: 'War and Hope', medium: 'Oil on canvas', size: '100 × 90 cm', year: 2022 },
  20: { title: 'Captives', size: '100 × 90 cm' },
  21: { title: 'Vegetable Seller', medium: 'Oil on canvas', size: '100 × 80 cm', year: 2022 },
  22: { title: 'The Martyr in the War', size: '90 × 60 cm', year: 2022 },
  23: { title: 'Take Root', size: '100 × 80 cm' },
  24: { title: 'Waiting', size: '100 × 80 cm' },
  25: { title: 'Old House', size: '100 × 80 cm' },
  26: { medium: 'Oil', year: 2022 },
  27: { title: 'Candle', size: '100 × 80 cm' },
  28: { title: 'The Burial of Hope', size: '100 × 80 cm', year: 2024 },
};

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
    items: paintingSizes.map((s, i) => s && [`painting-${i + 1}`, i < 14 ? i + 9 : i + 15, 'Painting', ...s, paintingDetails[i + 1]]).filter(Boolean),
  },
};

const pad = n => String(n).padStart(2, '0');
const card = (dir, [file, no, medium, w, h, { title, size, year, ...d } = {}]) => `
  <figure class="frame reveal">
    <img src="Assets/Web/${dir}/${file}.jpg" alt="${title || medium}, № ${pad(no)}" width="${w}" height="${h}" loading="lazy">
    <figcaption>${title ? `<span class="work-title">${title}</span>` : ''}№ ${pad(no)} · ${[d.medium || medium, size, year].filter(Boolean).join(' · ')}</figcaption>
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

function show(i) {
  index = (i + group.length) % group.length;
  const fig = group[index];
  const img = fig.querySelector('img');
  boxImg.src = img.src.replace('/Assets/Web/', '/Assets/Images/'); // full-size original
  boxImg.alt = img.alt;
  boxCap.innerHTML = fig.dataset.caption || fig.querySelector('figcaption')?.innerHTML || ''; // keeps the title line; both are this site's own markup
  boxCap.hidden = !boxCap.textContent;
}

function openBox(fig) {
  lastFocus = fig;
  // Step through the photos of the same gallery or journal; others open on their own
  const set = fig.closest('[data-gallery], .journal');
  group = set ? [...set.querySelectorAll('.frame, .photo')] : [fig];
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
