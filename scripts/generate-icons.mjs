// Régénère tous les PNG d'icônes depuis les sources SVG. `npm run icons`.
//
// Source unique de la marque : le calque du bundle Icon Composer
// (`assets/expo.icon/Assets/expo-symbol 2.svg`), qui est dessiné sur fond transparent — le fond
// #1F2421 vient de `fill` dans icon.json. Ce script recompose donc ce fond lui-même pour les
// cibles qui en ont besoin (icon.png, favicon) et le laisse transparent pour les autres.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const IMAGES = join(ROOT, 'assets/images');
const TAB_IMAGES = join(IMAGES, 'tabIcons');

const MARK_SVG = join(ROOT, 'assets/expo.icon/Assets/expo-symbol 2.svg');
const TABS_DIR = join(ROOT, 'assets/icons/tabs');

/** Fond de la marque, identique au `fill` de `assets/expo.icon/icon.json`. */
const BACKGROUND = '#1F2421';

/**
 * L'adaptive icon Android ne garantit que le cercle central de 66/108 du cadre. La marque a un
 * rayon circonscrit de 197/256, il faut donc la réduire pour que les coins de la carte ne soient
 * pas rognés par les lanceurs à masque rond.
 */
const ANDROID_SAFE_SCALE = 0.78;

const TABS = ['home', 'coordinates', 'azimuth', 'compass', 'slope'];
/** Densités React Native : `name.png`, `name@2x.png`, `name@3x.png`. */
const TAB_SIZES = [
  { size: 24, suffix: '' },
  { size: 48, suffix: '@2x' },
  { size: 72, suffix: '@3x' },
];

/**
 * Rastérise un SVG à la taille voulue. La densité est poussée pour que librsvg dessine à la
 * résolution cible : rastériser à la taille naturelle du viewBox puis agrandir écrase les tirets
 * du tracé d'azimut.
 */
function render(svg, size) {
  return sharp(svg, { density: 600 }).resize(size, size).png().toBuffer();
}

/** Aplat de couleur, ou fond transparent si `color` est nul. */
function canvas(size, color) {
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: color ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });
}

/** La marque centrée sur un cadre carré, éventuellement réduite pour tenir dans une zone sûre. */
async function mark(svg, size, { background = null, scale = 1 } = {}) {
  const inner = Math.round(size * scale);
  const drawn = await render(svg, inner);
  const offset = Math.round((size - inner) / 2);
  return canvas(size, background)
    .composite([{ input: drawn, left: offset, top: offset }])
    .png()
    .toBuffer();
}

/** Masque d'alpha : force le RVB à blanc en conservant la transparence. */
async function silhouette(png) {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += info.channels) {
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

/** Coins arrondis à la façon d'iOS — utile seulement là où aucun masque système ne s'applique. */
async function rounded(png, size) {
  const radius = Math.round(size * 0.2237);
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
      `<rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`
  );
  return sharp(png)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

async function write(path, buffer) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, buffer);
  console.log(`  ${path.slice(ROOT.length + 1)}`);
}

async function main() {
  const svg = await readFile(MARK_SVG);

  console.log('Icônes système');
  // Sans arrondi : iOS et Android appliquent leur propre masque.
  await write(join(IMAGES, 'icon.png'), await mark(svg, 1024, { background: BACKGROUND }));
  await write(
    join(IMAGES, 'android-icon-foreground.png'),
    await mark(svg, 512, { scale: ANDROID_SAFE_SCALE })
  );
  await write(
    join(IMAGES, 'android-icon-monochrome.png'),
    await silhouette(await mark(svg, 432, { scale: ANDROID_SAFE_SCALE }))
  );
  // Le plugin expo-splash-screen pose lui-même le fond.
  await write(join(IMAGES, 'splash-icon.png'), await mark(svg, 512));
  // Le navigateur ne masque rien : l'arrondi doit être dans l'image.
  await write(
    join(IMAGES, 'favicon.png'),
    await rounded(await mark(svg, 64, { background: BACKGROUND }), 64)
  );

  console.log("Icônes d'onglets");
  for (const name of TABS) {
    const tab = await readFile(join(TABS_DIR, `${name}.svg`));
    for (const { size, suffix } of TAB_SIZES) {
      await write(join(TAB_IMAGES, `${name}${suffix}.png`), await render(tab, size));
    }
  }
}

await main();
