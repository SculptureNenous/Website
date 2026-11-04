// The works live in data/paintings.json and data/sculptures.json, which Nenous edits through Pages CMS.
// width/height (filled in by tools/prepare-images.cjs) reserve each photo's space so nothing shifts while scrolling.
const pad = n => String(n).padStart(2, '0');
const esc = s => String(s).replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`); // titles are typed in the CMS
const card = ({ image, number, title, medium, size, year, width, height }) => `
  <figure class="frame reveal">
    <img src="${esc(image.replace('Assets/Images/', 'Assets/Web/'))}" alt="${esc(title || medium)}, № ${pad(number)}"${width ? ` width="${width}" height="${height}"` : ''} loading="lazy">
    <figcaption>${title ? `<span class="work-title">${esc(title)}</span>` : ''}№ ${pad(number)} · ${esc([medium, size, year].filter(Boolean).join(' · '))}</figcaption>
  </figure>`;

// Two fixed columns (first half left, as in the original) instead of CSS columns,
// which re-balance and swap works between columns as lazy images load.
for (const [name, file] of [['sculpture', 'sculptures'], ['painting', 'paintings']]) {
  try {
    const items = await fetch(`data/${file}.json`, { cache: 'no-cache' }).then(r => r.json());
    const half = Math.floor(items.length / 2);
    document.querySelector(`[data-gallery="${name}"]`).innerHTML = [items.slice(0, half), items.slice(half)]
      .map(col => `<div class="gallery-col">${col.map(card).join('')}</div>`).join('');
  } catch (err) {
    console.error(`Could not load data/${file}.json`, err); // the rest of the page still works
  }
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
