// Settings window: edit timing, tint and breed, then save to the main process.

const form = document.getElementById('form');
const intervalInput = document.getElementById('interval');
const napInput = document.getElementById('nap');
const tints = document.getElementById('tints');
const breeds = document.getElementById('breeds');
const status = document.getElementById('status');
let customColorInput;

// Builds <label class="choice"><input type=radio><span class="card">…</span></label>
function choice(name, value, checked, ...cardChildren) {
  const label = document.createElement('label');
  label.className = 'choice';
  const input = document.createElement('input');
  input.type = 'radio';
  input.name = name;
  input.value = value;
  input.checked = checked;
  const card = document.createElement('span');
  card.className = 'card';
  card.append(...cardChildren);
  label.append(input, card);
  return { label, input };
}

function text(str) {
  const span = document.createElement('span');
  span.textContent = str;
  return span;
}

function chip(color) {
  const c = document.createElement('span');
  c.className = 'chip';
  const fill = document.createElement('span');
  fill.style.background = tintFor(color);
  c.append(fill);
  return { chip: c, fill };
}

function buildTints(current) {
  for (const name of Object.keys(TINTS)) {
    const { chip: c } = chip(name);
    tints.append(choice('color', name, current === name, c, text(name)).label);
  }

  // Custom color: the chip doubles as a color picker.
  const isCustom = !TINTS[current];
  const { chip: c, fill } = chip(isCustom ? current : '#ffd59e');
  customColorInput = document.createElement('input');
  customColorInput.type = 'color';
  customColorInput.value = isCustom ? current : '#ffd59e';
  c.append(customColorInput);
  const { label, input } = choice('color', 'custom', isCustom, c, text('custom'));
  customColorInput.addEventListener('input', () => {
    fill.style.background = tintFor(customColorInput.value);
    input.checked = true;
  });
  tints.append(label);
}

function buildBreeds(current) {
  for (const [id, breed] of Object.entries(BREEDS)) {
    const canvas = document.createElement('canvas');
    canvas.width = FRAME;
    canvas.height = FRAME;
    new CatSprite(canvas, id); // animates the sitting pose in this breed's colors
    breeds.append(choice('breed', id, current === id, canvas, text(breed.name)).label);
  }
  const surprise = document.createElement('span');
  surprise.className = 'surprise';
  surprise.textContent = '?';
  breeds.append(choice('breed', 'random', current === 'random', surprise, text('Surprise me')).label);
}

function readForm() {
  const color = form.elements.color.value;
  return {
    intervalMinutes: Number(intervalInput.value),
    napMinutes: Number(napInput.value),
    color: color === 'custom' ? customColorInput.value : color,
    breed: form.elements.breed.value,
  };
}

async function save() {
  if (!form.reportValidity()) return false;
  await window.catBreak.saveSettings(readForm());
  status.textContent = 'Saved!';
  setTimeout(() => { status.textContent = ''; }, 2000);
  return true;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  save();
});

document.getElementById('preview').addEventListener('click', async () => {
  if (await save()) window.catBreak.previewBreak();
});

(async function init() {
  const s = await window.catBreak.getSettings();
  intervalInput.value = s.intervalMinutes;
  napInput.value = s.napMinutes;
  buildTints(s.color);
  buildBreeds(s.breed);
})();
