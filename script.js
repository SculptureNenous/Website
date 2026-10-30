// Catalogue: [file, catalogue number, medium]. Numbers follow the original site's ledger.
const works = {
  sculpture: {
    dir: 'Statues',
    items: [
      ['Statue-2', 5, 'Bronze'], ['Statue-1', 4, 'Bronze'], ['Statue-3', 6, 'Cast Relief'],
      ['Statue-4', 7, 'Cast Relief'], ['Statue-5', 8, 'Cast Relief'], ['Statue-6', 23, 'Cast Relief'],
      ['Statue-7', 24, 'Cast Relief'], ['Statue-8', 25, 'Bronze'], ['Statue-9', 26, 'Sculpture'],
      ['Statue-10', 27, 'Bronze'], ['Statue-11', 28, 'Clay'],
    ],
  },
  painting: {
    dir: 'Paintings',
    // painting-1..28 are catalogued №09..№22 and №29..№42
    items: Array.from({ length: 28 }, (_, i) => [`painting-${i + 1}`, i < 14 ? i + 9 : i + 15, 'Painting']),
  },
};

const pad = n => String(n).padStart(2, '0');

for (const [name, { dir, items }] of Object.entries(works)) {
  document.querySelector(`[data-gallery="${name}"]`).innerHTML = items.map(([file, no, medium]) => `
    <figure class="frame reveal">
      <img src="Assets/Images/${dir}/${file}.jpg" alt="${medium}, № ${pad(no)}" loading="lazy">
      <figcaption>№ ${pad(no)} · ${medium}</figcaption>
    </figure>`).join('');
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
