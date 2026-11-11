// Colors shared by the overlay and the settings window.

// ---------- Screen tints ----------

const TINTS = {
  pink:   '#ffb6ce',
  blue:   '#aed6f1',
  purple: '#cbb4f0',
  green:  '#b6e6bd',
};
const TINT_ALPHA = 0.55;

// Accepts a tint name ("pink") or a hex color ("#ffd59e") and returns a see-through rgba().
function tintFor(color) {
  const hex = TINTS[color] ?? color;
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return tintFor('pink');
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${TINT_ALPHA})`;
}

// ---------- Cat breeds (palette swaps) ----------
//
// Draw your sprites using ONLY the orange-tabby colors below (the "template").
// Each breed swaps those exact template colors for its own. Pixels in any other
// color are left alone, so a red collar stays red on every cat.
//
// Tip: set `patches` equal to `fur` to hide stripes/spots on solid-colored cats.

const BREEDS = {
  'orange-tabby': {
    name: 'Orange tabby',
    colors: {
      outline:    '#4a3228',
      fur:        '#f0a35e',
      furShadow:  '#d9873f',
      patches:    '#c46a2b',
      chest:      '#fbe3c4',
      nose:       '#f7b2c4',
      eye:        '#6b8f3a',
    },
  },
  tuxedo: {
    name: 'Tuxedo',
    colors: {
      outline: '#15131a', fur: '#2f2c38', furShadow: '#1f1c26', patches: '#2f2c38',
      chest: '#f5f2ee', nose: '#f7b2c4', eye: '#d9c24a',
    },
  },
  gray: {
    name: 'Gray',
    colors: {
      outline: '#3c4150', fur: '#9aa3b5', furShadow: '#7c8597', patches: '#87909f',
      chest: '#c3c9d4', nose: '#d99aa8', eye: '#e0b84a',
    },
  },
  black: {
    name: 'Black',
    colors: {
      outline: '#121015', fur: '#2b2930', furShadow: '#1c1a20', patches: '#2b2930',
      chest: '#2b2930', nose: '#6b4a52', eye: '#e8c547',
    },
  },
  white: {
    name: 'White',
    colors: {
      outline: '#8a7f75', fur: '#f7f4ef', furShadow: '#ddd6cc', patches: '#f7f4ef',
      chest: '#ffffff', nose: '#f7b2c4', eye: '#6aa6d8',
    },
  },
  calico: {
    name: 'Calico',
    colors: {
      outline: '#4a3228', fur: '#f7f4ef', furShadow: '#ddd6cc', patches: '#e39a4f',
      chest: '#ffffff', nose: '#f7b2c4', eye: '#c9a23a',
    },
  },
};

const DEFAULT_BREED = 'orange-tabby';
const TEMPLATE = BREEDS[DEFAULT_BREED].colors;

function resolveBreed(id) {
  if (id === 'random') {
    const ids = Object.keys(BREEDS);
    return ids[Math.floor(Math.random() * ids.length)];
  }
  return BREEDS[id] ? id : DEFAULT_BREED;
}
