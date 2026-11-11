# Drawing the cat (Piskel, first-timer friendly)

The app already runs with a placeholder cat drawn in code. Each PNG you export
into `assets/` replaces one placeholder animation, so you can swap them in one at a time.

## What the code expects

| File                    | Frames | What it shows                        |
|-------------------------|--------|--------------------------------------|
| `assets/cat-sit.png`    | 1–2    | Sitting and talking to you (tail flick) |
| `assets/cat-sleep.png`  | 2      | Curled-up nap (body rises/falls)     |
| `assets/cat-walk.png`   | 4      | Walking across the screen            |

Rules that apply to every sheet:

- **32 × 32 px per frame**, all frames in **one row** (so 4 frames = 128 × 32).
- **Cat faces right.**
- **Transparent background.**
- **Same "floor" line in every animation**: feet (or belly, when sleeping) on
  the same row, about row 27–28. Otherwise the cat jumps when it switches from walking to sitting.

The frame count is read from the image width, so adding a 5th walk frame needs
no code change. Speed (fps) lives in `ANIMATIONS` in [src/sprites.js](../src/sprites.js).

## Setting up Piskel

1. Go to <https://www.piskelapp.com> → **Create Sprite**.
2. Right panel → **Resize** → 32 × 32 (uncheck "maintain aspect ratio" if needed).
3. Turn on the **grid** (Preferences → Grid) so every pixel is visible.
4. Use the top-right preview window. Set its FPS to match the table above
   (walk 8, sit 2, sleep 1).

## Use the template palette (this is how breeds work)

You draw **one** cat, an orange tabby, using exactly these 7 colors. The app
swaps them per breed (tuxedo, gray, black, white, calico) when it loads.

| Slot      | Hex       | Paint it on…                                        |
|-----------|-----------|-----------------------------------------------------|
| outline   | `#4a3228` | outline, pupils, closed eyes                        |
| fur       | `#f0a35e` | main body color                                     |
| furShadow | `#d9873f` | shaded side, far legs, tail                         |
| patches   | `#c46a2b` | stripes or spots (hidden on solid-color breeds)     |
| chest     | `#fbe3c4` | belly, chest, muzzle, paws (white on tuxedo/calico) |
| nose      | `#f7b2c4` | nose, inner ears                                    |
| eye       | `#6b8f3a` | eye color                                           |

**Import it into Piskel:** in the Palettes panel (left), click the gear →
**Import** → pick [art/cat-template.gpl](../art/cat-template.gpl).

Rules:
- Use these **exact** colors, with no anti-aliasing and no semi-transparent pixels.
  One shade off and that pixel won't recolor.
- Any *other* color is left as is on every breed, which is handy for a collar or bell.
- Breed colors live in `BREEDS` in [src/theme.js](../src/theme.js). Add your own breed
  by copying one entry and changing the hex values. It shows up in Settings automatically.

## Draw in this order: sit → sleep → walk

### 1. Sit (start here — it's just one drawing)

1. **Silhouette first**: fill the whole cat shape in the base color. Ignore details.
   Squint: does it read as a cat? Big head + pointy ears + tail is enough.
2. **Outline** around the silhouette (1 px).
3. **Shadow** on the side away from the light (pick "light from top-left" and stick to it).
4. **Details**: eyes (2×2 px is plenty), pink nose, inner ears.
5. Optional 2nd frame: **duplicate the frame** (frame list → duplicate icon) and
   move only the tail tip by 1–2 px. That's your tail flick.

### 2. Sleep (2 frames)

- Draw a "loaf": body low and wide, head resting on one side, tail curled in front.
- Closed eyes are just a 2-px horizontal line.
- Duplicate the frame, then raise the top edge of the body by **1 px**. At 1 fps
  that reads as breathing.

### 3. Walk (4 frames, the hardest one, so do it last)

A classic 4-frame walk cycle:

1. **Contact**: legs spread apart (front leg forward, back leg back).
2. **Passing**: legs together under the body, **body 1 px higher**.
3. **Contact (opposite)**: the mirror of frame 1, with the other legs forward.
4. **Passing**: same as frame 2.

Tips:
- Draw frame 1, duplicate it 3 times, then edit only the legs and the 1-px body bob.
- Turn on **onion skin** (the button above the frame list). It shows the previous
  frame faintly so you can line things up.
- It's fine if it looks a bit stiff. At 8 fps and 4× size, small moves read well.

## Exporting

1. **Export** (right panel) → **PNG** tab → **Spritesheet**.
2. Set **columns = number of frames** (so you get 1 row).
3. Download and save as the filename from the table, inside `assets/`.
4. Also **Save** → **Save as .piskel** into `art/`, so you can keep editing later
   (the PNG is the output; the .piskel file is your editable source).

Restart the app (`npm run dev`) to see your cat.

## Learning more (optional)

- Pedro Medeiros' short pixel art tutorials (search "saint11 pixel art tutorials").
- Search "pixel art cat 32x32" for reference, but draw your own. Copying shapes
  is fine practice; copying someone's sprite isn't.
