// Makes the 800px web copy (Assets/Web/...) of any work photo that doesn't have one yet, and
// records each web copy's width/height in data/*.json. Run by .github/workflows/deploy.yml.
// shortcut: a photo replaced under the same file name keeps its old web copy; delete that copy to remake it.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const formats = { '.jpg': 'jpeg', '.jpeg': 'jpeg', '.png': 'png', '.webp': 'webp' };

(async () => {
  for (const file of ['data/paintings.json', 'data/sculptures.json']) {
    const works = JSON.parse(fs.readFileSync(file, 'utf8'));
    let changed = false;
    for (const work of works) {
      const src = work.image;
      const web = src.replace(/^Assets\/Images\//, 'Assets/Web/');
      if (!src.startsWith('Assets/Images/') || !fs.existsSync(src)) throw new Error(`${file}: photo not found: ${src}`);
      if (!fs.existsSync(web)) {
        fs.mkdirSync(path.dirname(web), { recursive: true });
        await sharp(src)
          .rotate() // phone photos are often stored sideways with a "rotate me" note
          .resize({ width: 800, withoutEnlargement: true })
          .toFormat(formats[path.extname(src).toLowerCase()], { quality: 74 })
          .toFile(web);
        console.log(`Made ${web}`);
      }
      const { width, height } = await sharp(web).metadata();
      if (work.width !== width || work.height !== height) {
        Object.assign(work, { width, height });
        changed = true;
      }
    }
    if (changed) fs.writeFileSync(file, JSON.stringify(works, null, 2) + '\n');
  }
})().catch(err => { console.error(err.message); process.exit(1); });
