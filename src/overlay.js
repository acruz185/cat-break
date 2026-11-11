// Overlay page: runs one break from start to finish when the main process says so.

const YES = 'Yes, nap time';
const NO = 'Not now';
const SKIP_HOLD_MS = 3000; // keep in sync with the #skip-bar transition in overlay.css
const SKIPPED = new Error('break skipped');

const STRETCHES = [
  'Roll your shoulders back slowly, 5 times.',
  'Interlace your fingers and reach up as high as you can.',
  'Gently tilt your ear toward each shoulder. Hold 10 seconds each side.',
  'Stand up and reach for your toes (or try to!).',
  'Hold one arm out, palm up, and gently pull your fingers back. Switch hands.',
];

const cat = new CatSprite(document.getElementById('cat'));
const wrap = document.getElementById('cat-wrap');
const bubble = document.getElementById('bubble');
const bubbleText = document.getElementById('bubble-text');
const bubbleButtons = document.getElementById('bubble-buttons');
const activity = document.getElementById('activity');
const skipHint = document.getElementById('skip-hint');

let catX = -160;
let breakActive = false;
let breakAbort = new AbortController(); // aborting it ends the current break early

// ---------- small helpers ----------

// Wraps a promise so it rejects as soon as the break is skipped.
function abortable(executor) {
  const signal = breakAbort.signal;
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason);
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    executor(resolve, signal);
  });
}

const wait = (ms) => abortable((resolve) => setTimeout(resolve, ms));
const sleepMs = (ms) => new Promise((resolve) => setTimeout(resolve, ms)); // not skippable
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

function setCatX(x) {
  catX = x;
  wrap.style.transform = `translateX(${x}px)`;
}

function walkTo(targetX, pxPerSecond = 180) {
  cat.play('walk');
  return abortable((resolve, signal) => {
    let last = performance.now();
    function step(now) {
      if (signal.aborted) return;
      const dx = Math.sign(targetX - catX) * pxPerSecond * ((now - last) / 1000);
      last = now;
      if (Math.abs(targetX - catX) <= Math.abs(dx)) {
        setCatX(targetX);
        resolve();
        return;
      }
      setCatX(catX + dx);
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

// Shows a speech bubble. With buttons, resolves to the label that was clicked.
function say(text, buttons = []) {
  bubbleText.textContent = text;
  bubbleButtons.replaceChildren();
  bubble.hidden = false;
  if (buttons.length === 0) return Promise.resolve();
  return abortable((resolve) => {
    for (const label of buttons) {
      const b = document.createElement('button');
      b.textContent = label;
      b.addEventListener('click', () => resolve(label));
      bubbleButtons.append(b);
    }
  });
}

async function countdown(seconds, render) {
  for (let s = seconds; s > 0; s--) {
    render(s);
    await wait(1000);
  }
}

// ---------- emergency skip: hold Esc ----------

let skipTimer = null;

function cancelSkipHold() {
  clearTimeout(skipTimer);
  skipTimer = null;
  skipHint.classList.remove('holding');
}

window.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || e.repeat || !breakActive || skipTimer) return;
  skipHint.classList.add('holding');
  skipTimer = setTimeout(() => {
    cancelSkipHold();
    breakAbort.abort(SKIPPED);
  }, SKIP_HOLD_MS);
});
window.addEventListener('keyup', (e) => { if (e.key === 'Escape') cancelSkipHold(); });
window.addEventListener('blur', cancelSkipHold);

// ---------- the break itself ----------

async function runBreak(data) {
  breakAbort = new AbortController();
  breakActive = true;
  try {
    await breakFlow(data);
  } catch (err) {
    if (err !== SKIPPED) console.error(err); // a bug shouldn't trap you on the overlay
  }
  breakActive = false;
  cancelSkipHold();
  document.body.classList.remove('visible'); // fade everything out
  await sleepMs(1500);
  bubble.hidden = true;
  activity.hidden = true;
  wrap.classList.remove('sleeping');
  window.catBreak.finishBreak();
}

async function breakFlow({ minutesWorked, napMinutes, color, breed }) {
  document.documentElement.style.setProperty('--tint', tintFor(color));
  cat.setBreed(resolveBreed(breed));
  bubble.hidden = true;
  activity.hidden = true;
  setCatX(-160);

  await nextFrame();
  document.body.classList.add('visible'); // fade the tint in
  await wait(800);

  await walkTo(window.innerWidth / 2 - 64);
  cat.play('sit');
  const choice = await say(`It's been ${minutesWorked} minutes! Time for a break?`, [YES, NO]);

  if (choice === YES) await napBreak(napMinutes);
  else await miniBreak();

  bubble.hidden = true;
  activity.hidden = true;
  await walkTo(window.innerWidth + 40);
}

async function napBreak(napMinutes) {
  cat.play('sleep');
  wrap.classList.add('sleeping');
  await countdown(Math.round(napMinutes * 60), (s) =>
    say(`Zzz... wake me in ${fmt(s)}. Go stretch, drink some water, look outside!`));
  wrap.classList.remove('sleeping');
  cat.play('sit');
  await say('Welcome back! Ready to get back to it?', ['Back to work']);
}

async function miniBreak() {
  await pick([breathing, eyeRest, stretch])();
  await say('Thanks for taking a moment. Back to it!', ['Okay!']);
}

async function breathing() {
  say('Okay... but breathe with me first.');
  activity.innerHTML = '<h2>Breathe with the circle</h2><div class="breath-circle"></div><p class="breath-label"></p>';
  activity.hidden = false;
  const circle = activity.querySelector('.breath-circle');
  const label = activity.querySelector('.breath-label');
  for (let i = 0; i < 4; i++) {
    label.textContent = 'Breathe in...';
    circle.classList.add('in');
    await wait(4000);
    label.textContent = 'Breathe out...';
    circle.classList.remove('in');
    await wait(4000);
  }
  activity.hidden = true;
}

async function eyeRest() {
  say('Okay... but rest your eyes first.');
  activity.innerHTML = '<h2>20-20-20</h2><p>Look at something about 20 feet (6 m) away until the timer ends.</p><p class="big-timer"></p>';
  activity.hidden = false;
  const timer = activity.querySelector('.big-timer');
  await countdown(20, (s) => { timer.textContent = s; });
  activity.hidden = true;
}

async function stretch() {
  say('Okay... but stretch with me first.');
  activity.innerHTML = '<h2>Stretch</h2><p class="stretch-text"></p><button disabled></button>';
  activity.querySelector('.stretch-text').textContent = pick(STRETCHES);
  activity.hidden = false;
  const done = activity.querySelector('button');
  await countdown(15, (s) => { done.textContent = `Done (${s})`; });
  done.textContent = 'Done!';
  done.disabled = false;
  await abortable((resolve) => done.addEventListener('click', resolve, { once: true }));
  activity.hidden = true;
}

window.catBreak.onStartBreak(runBreak);
