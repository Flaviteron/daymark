# Daymark

A daily check-list you can install on Windows, Android and iPhone. Habits live on a
month sheet (rows are habits, columns are days), to-dos live in Today and Later, and
Progress shows streaks. It works offline and every person's data stays on their own
device.

Daymark is a plain installable web app (PWA): static HTML, CSS and JavaScript with no
build step, no framework and no server.

## Install

Open the app's link, then:

**Windows (Chrome or Edge)**
1. Open the link in Chrome or Edge.
2. Chrome: click the install icon at the right end of the address bar (a monitor with
   a down arrow), or menu (⋮) > Cast, save and share > Install page as app.
   Edge: menu (…) > Apps > Install this site as an app.
3. Confirm with Install. Daymark opens in its own window and appears in the Start menu;
   right-click its taskbar icon to pin it.

**Android (Chrome)**
1. Open the link in Chrome.
2. Tap the menu (⋮) > Add to Home screen > Install.
3. Daymark appears on the home screen and in the app drawer.

**iPhone or iPad (Safari)**
1. Open the link in Safari (it must be Safari, not an in-app browser).
2. Tap the Share button (square with an up arrow).
3. Scroll down, tap Add to Home Screen, then Add.

After the first visit the app opens with no internet.

## Moving data between devices, and backups

Data is stored only on the device, inside that browser or installed app.

1. On the device that has your data: More > Export to file. This saves
   `daymark-backup-YYYY-MM-DD.json`.
2. Send that file to the other device (email, cloud drive, messenger, USB).
3. On the other device: More > Import from file, choose the file, confirm Replace.

Import replaces what is on that device; it does not merge. Export regularly as a
backup: clearing the browser's site data, or removing the app on iPhone, deletes the
checklist.

## Sharing with other people

Send them the link. Each person installs it using the steps above and starts with an
empty sheet of their own. Nothing you enter is visible to anyone else, because nothing
leaves your device.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | Page shell and dialogs |
| `css/app.css` | All styling, light and dark |
| `js/app.js` | App logic |
| `js/i18n.js` | Every piece of interface text, in one place |
| `sw.js` | Service worker: caches the app for offline use |
| `manifest.webmanifest` | Name, icons, colours for installation |
| `icons/`, `fonts/` | Bundled icons and fonts (no external CDNs) |

## Changing the app

- **After changing any file**, bump `CACHE` in `sw.js` (for example `daymark-1.0.1`)
  and `VERSION` in `js/app.js`. Installed copies then show "A new version is ready"
  with a Reload button.
- **Adding a language** (Uzbek, Russian): copy the `en` block in `js/i18n.js`, rename
  it `uz` or `ru`, translate the values. A language picker appears in More once a
  second language exists. Note: the bundled fonts cover Latin script only, so Cyrillic
  text falls back to the device's system font unless Cyrillic font files are added.
- **Run locally**: `python -m http.server 8765` in this folder, then open
  `http://localhost:8765`. (Opening `index.html` directly from disk works too, but
  without offline caching or installation.)

## Hosting

Any static host works. For GitHub Pages: push this folder to a repository, then
Settings > Pages > Deploy from a branch > `main`, folder `/ (root)`. The app is then
at `https://<username>.github.io/<repository>/`.

## Credits

Fonts: Bricolage Grotesque and Instrument Sans, both under the SIL Open Font License
(see `fonts/OFL-*.txt`).
