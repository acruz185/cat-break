# cat-break
DS219 Final Project

A pixel-art cat that walks onto your screen to remind you to take breaks.

- After a configurable interval, the screen fades into a pastel tint and the cat walks in.
- **Yes**: the cat naps for 5 minutes while you step away.
- **Not now**: you do a short mind-break first (breathing, 20-20-20 eye rest, or a stretch).
- **Emergency skip**: hold **Esc** for 3 seconds to end the break immediately.

## Running

```sh
npm install
npm run dev     # breaks every 15 seconds and 15-second naps, for testing
npm start       # normal mode, uses your saved settings
```

The app lives in the system tray (pink cat icon). Right-click it for
**Take a break now**, **Settings…**, or **Quit**. Double-clicking it also opens Settings.

## Settings

The settings window controls:

- break interval and nap length (minutes)
- screen tint: pink, blue, purple, green, or a custom color
- cat breed: orange tabby, tuxedo, gray, black, white, calico, or "Surprise me" (random each break)

Settings are saved to `settings.json` in Electron's user-data folder
(on Windows: `%APPDATA%\cat-break\settings.json`).

## Project layout

```
main.js            Electron main process: timer, settings, tray, windows
preload.js         Safe bridge between main and the pages
src/overlay.*      The break screen: tint, cat, speech bubble, mini tasks, Esc skip
src/settings.*     The settings window
src/theme.js       Tint colors and breed palettes (shared)
src/sprites.js     Sprite sheet loading, breed recoloring, placeholder cat
assets/            Exported sprite sheets (PNG) used by the app
art/               Editable .piskel files + the template palette (cat-template.gpl)
docs/ART_GUIDE.md  How to draw the cat sprites
```
