// Draws the cat from sprite sheets made in Piskel, recolored per breed.
//
// Each sheet is ONE row of FRAME x FRAME frames, cat facing RIGHT, drawn with
// the template palette from theme.js. Drop your exports into assets/ as
// cat-walk.png, cat-sit.png, cat-sleep.png. The frame count is read from the
// image width, so a 4-frame walk is a 128x32 PNG with no code change needed.
// Until a file exists, a placeholder cat drawn in code is used instead.

const FRAME = 32;

const ANIMATIONS = {
  walk:  { fps: 8, placeholderFrames: 4 },
  sit:   { fps: 2, placeholderFrames: 2 },
  sleep: { fps: 1, placeholderFrames: 2 },
};

class CatSprite {
  constructor(canvas, breedId = DEFAULT_BREED) {
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.raw = {};    // sheets in template colors
    this.sheets = {}; // sheets recolored for the current breed
    this.current = 'sit';
    this.frame = 0;
    this.lastTick = 0;

    for (const [name, anim] of Object.entries(ANIMATIONS)) {
      this.raw[name] = makePlaceholderSheet(name, anim.placeholderFrames);
    }
    this.setBreed(breedId);
    this.loadArt();
    requestAnimationFrame((t) => this.tick(t));
  }

  // Swap placeholders for your real PNGs (the main process reads them from assets/).
  async loadArt() {
    for (const name of Object.keys(ANIMATIONS)) {
      const url = await window.catBreak.loadSprite(name);
      if (!url) continue; // no PNG yet; keep the placeholder
      this.raw[name] = await loadImage(url);
    }
    this.setBreed(this.breed);
  }

  setBreed(breedId) {
    this.breed = BREEDS[breedId] ? breedId : DEFAULT_BREED;
    const palette = BREEDS[this.breed].colors;
    for (const name of Object.keys(ANIMATIONS)) {
      this.sheets[name] = recolor(this.raw[name], palette);
    }
  }

  play(name) {
    if (name === this.current) return;
    this.current = name;
    this.frame = 0;
  }

  tick(now) {
    const sheet = this.sheets[this.current];
    const frames = Math.max(1, Math.floor(sheet.width / FRAME));
    if (now - this.lastTick >= 1000 / ANIMATIONS[this.current].fps) {
      this.frame = (this.frame + 1) % frames;
      this.lastTick = now;
    }
    this.ctx.clearRect(0, 0, FRAME, FRAME);
    this.ctx.drawImage(sheet, this.frame * FRAME, 0, FRAME, FRAME, 0, 0, FRAME, FRAME);
    requestAnimationFrame((t) => this.tick(t));
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

const hexToInt = (hex) => parseInt(hex.slice(1), 16);

// Returns a copy of `source` with every template-colored pixel swapped for the breed's color.
function recolor(source, palette) {
  const swap = new Map();
  for (const [slot, templateHex] of Object.entries(TEMPLATE)) {
    swap.set(hexToInt(templateHex), hexToInt(palette[slot]));
  }

  const c = document.createElement('canvas');
  c.width = source.width;
  c.height = source.height;
  const g = c.getContext('2d');
  g.drawImage(source, 0, 0);
  const img = g.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue; // transparent
    const to = swap.get((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
    if (to === undefined) continue; // not a template color; leave it
    d[i] = to >> 16;
    d[i + 1] = (to >> 8) & 255;
    d[i + 2] = to & 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

// ---------- Placeholder art (delete once your own sprites exist) ----------
// Drawn in template colors so breed recoloring works on it too.

function px(g, color, x, y, w = 1, h = 1) {
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
}

const PLACEHOLDER_DRAW = {
  // 4-frame walk cycle: stride, passing, opposite stride, passing.
  walk(g, f) {
    const T = TEMPLATE;
    const bob = f % 2; // body rises 1px on passing frames
    const legs = [[6, 10, 15, 19], [8, 9, 17, 18], [10, 6, 19, 15], [8, 9, 17, 18]][f];
    px(g, T.furShadow, 3 + bob, 11 - bob, 2, 8);  // tail
    px(g, T.fur, 6, 17 - bob, 16, 7);             // body
    px(g, T.chest, 12, 22 - bob, 8, 2);           // belly
    for (const x of [9, 12, 15]) px(g, T.patches, x, 17 - bob, 1, 3); // stripes
    for (const x of legs) px(g, T.furShadow, x, 24 - bob, 2, 4 + bob);
    px(g, T.fur, 19, 11 - bob, 9, 8);             // head
    px(g, T.chest, 24, 16 - bob, 4, 3);           // muzzle
    px(g, T.patches, 21, 11 - bob, 1, 2);         // forehead stripe
    px(g, T.fur, 19, 9 - bob, 2, 2);              // ears
    px(g, T.fur, 25, 9 - bob, 2, 2);
    px(g, T.eye, 24, 13 - bob, 1, 2);             // eye
    px(g, T.nose, 27, 16 - bob);                  // nose
  },
  // 2-frame sit: the tail flicks.
  sit(g, f) {
    const T = TEMPLATE;
    if (f === 0) px(g, T.furShadow, 22, 25, 7, 2);
    else { px(g, T.furShadow, 22, 24, 6, 2); px(g, T.furShadow, 27, 21, 2, 4); }
    px(g, T.fur, 10, 16, 12, 11);    // body
    px(g, T.chest, 13, 17, 6, 8);    // chest
    px(g, T.furShadow, 12, 27, 3, 1); // paws
    px(g, T.furShadow, 17, 27, 3, 1);
    px(g, T.fur, 9, 6, 14, 11);      // head
    for (const x of [13, 15, 18]) px(g, T.patches, x, 6, 1, 2); // forehead stripes
    px(g, T.chest, 13, 12, 6, 4);    // muzzle
    px(g, T.fur, 9, 3, 3, 3);        // ears
    px(g, T.fur, 20, 3, 3, 3);
    px(g, T.nose, 10, 4, 1, 2);
    px(g, T.nose, 21, 4, 1, 2);
    px(g, T.eye, 11, 9, 3, 2);       // eyes
    px(g, T.eye, 18, 9, 3, 2);
    px(g, T.outline, 12, 9, 1, 2);   // pupils
    px(g, T.outline, 19, 9, 1, 2);
    px(g, T.nose, 15, 13, 2, 1);     // nose
  },
  // 2-frame sleep: a loaf that breathes.
  sleep(g, f) {
    const T = TEMPLATE;
    px(g, T.fur, 5, 19 - f, 17, 8 + f);  // body
    for (const x of [8, 12, 16]) px(g, T.patches, x, 19 - f, 1, 3); // stripes
    px(g, T.furShadow, 4, 25, 18, 2);    // tail wrapped in front
    px(g, T.fur, 20, 18, 9, 9);          // head
    px(g, T.chest, 23, 23, 5, 3);        // muzzle
    px(g, T.fur, 20, 16, 2, 2);          // ears
    px(g, T.fur, 27, 16, 2, 2);
    px(g, T.outline, 22, 21, 2, 1);      // closed eyes
    px(g, T.outline, 26, 21, 2, 1);
  },
};

function makePlaceholderSheet(name, frames) {
  const c = document.createElement('canvas');
  c.width = FRAME * frames;
  c.height = FRAME;
  const g = c.getContext('2d');
  for (let f = 0; f < frames; f++) {
    g.save();
    g.translate(f * FRAME, 0);
    PLACEHOLDER_DRAW[name](g, f);
    g.restore();
  }
  return c;
}
