# Mina Atalla — Digital Business Card

A mobile-first, installable digital business card for **Mina Atalla, Senior Solution Engineer at Microsoft (Cairo, Egypt)**. Visitors can call, email, message on WhatsApp or Teams, open LinkedIn and the office location, save a contact card (vCard), and scan or share a QR code for the card.

It is a static site: plain HTML, CSS and ES modules, no framework, no backend, no runtime dependencies. The visual design takes inspiration from Microsoft Fluent 2. It is a personal card and does not claim to be an official Microsoft site.

## Features

- Profile header with photo (local fallback if the photo fails to load), title, company, location, two-line bio
- Quick actions: Call (`tel:`), Email (`mailto:`), WhatsApp (`wa.me`), Teams, LinkedIn, Location, optional Website. An action only appears when its value is configured and valid.
- **Save to Contacts**: builds a vCard 3.0 in the browser and downloads `mina-atalla.vcf`
- **Show QR Code**: accessible dialog (bottom sheet on phones) with a locally generated QR code, the readable URL, Copy Link (with fallback) and native Share (only where supported)
- Expertise chips
- Light, Dark and System themes; the choice is saved, with no flash of the wrong theme
- Installable PWA with a small, versioned offline cache
- WCAG 2.2 AA target: semantic HTML, visible focus, 44×44 px touch targets, live-region feedback, reduced-motion support
- Privacy: no analytics, cookies, trackers, remote fonts, remote images or remote QR services. Strict Content Security Policy.

## Technology choices

| Choice | Why |
| --- | --- |
| No framework, no bundler | One card page doesn't need one. It loads fast and deploys anywhere. |
| ES modules | Keeps the profile data (`src/profile.js`), the pure logic (`src/lib/`) and the DOM code (`src/app.js`) separate and testable. |
| Vendored QR encoder | Kazuhiko Arase's MIT-licensed encoder (`src/vendor/qrcode.js`), so QR codes are generated offline with no network calls. |
| Node's built-in test runner | Unit tests need no dependencies. |
| Playwright + ZXing (dev only) | Real-browser tests, including decoding the rendered QR code. |

## Project structure

```
index.html                 Page shell, metadata, CSP, local SVG icon sprite
manifest.webmanifest       PWA manifest (relative start_url/scope for sub-path hosting)
sw.js                      Service worker (same-origin static files only)
src/profile.js             ← THE profile configuration (edit this)
src/app.js                 Rendering and interactions
src/theme-init.js          Applies the saved/system theme before first paint
src/styles.css             Design tokens and responsive styles
src/lib/contact.js         Phone/email/URL validation, actions, vCard (pure functions)
src/lib/qr.js              QR matrix → SVG path
src/vendor/qrcode.js       Vendored QR encoder (MIT)
assets/                    Placeholder photo, icons, social image (+ SVG sources)
scripts/serve.mjs          Zero-dependency local server
scripts/build.mjs          Builds dist/ (cache version + social URLs)
scripts/validate.mjs       Manifest, asset reference, CSP, secret and import checks
scripts/generate-icons.mjs Rasterises SVG icon sources to PNG
tests/unit/                Node unit tests
tests/e2e/                 Playwright browser tests
.github/workflows/deploy.yml  Test + GitHub Pages deployment
```

## Prerequisites

- Node.js 22 or newer (needed for the scripts and tests; the site itself is static)
- For browser tests only: `npm install` and `npx playwright install chromium`

## Local development

```bash
npm start            # serves the repo at http://127.0.0.1:4173/
```

Use `PORT=8080 npm start` to change the port, or any static server (for example `python3 -m http.server`). Opening `index.html` directly from disk will **not** work: ES modules need an HTTP server.

## Build

```bash
npm run build        # writes dist/
npm run preview      # serves dist/ at http://127.0.0.1:4173/
```

The build copies only publishable files, stamps the service-worker cache version with a content hash, and, when `cardUrl` is set, injects `canonical`, `og:url`, `og:image` and `twitter:image`. It then validates the output.

## Tests

```bash
npm run validate     # static checks (manifest, local references, CSP, h1, tabindex, secrets)
npm test             # unit tests: phone normalisation, URL/email validation, actions, vCard escaping/folding, QR
npm run test:e2e     # builds, then runs the browser tests in Chromium
npm run check        # all of the above
```

The browser tests cover rendering with placeholder, populated, partial and empty configurations; link URIs and `rel`/`target`; vCard download; photo fallback; theme switching, persistence and blocked storage; no horizontal scroll from 320 px to 1920 px (portrait and landscape, with long values); 44 px touch targets; reduced motion; keyboard order; the dialog's focus trap, Escape, focus return, backdrop and scroll lock; QR decoding of an actual on-screen screenshot; Copy Link and its fallback; and conditional native Share. Screenshots are written to `test-results/` for manual review.

## Updating Mina's profile

Edit **`src/profile.js`**. That one file drives the page, the vCard, the QR code and the share text. Leave a field as `""` to hide it.

| Field | Format | Example |
| --- | --- | --- |
| `phone` | International, with country code. Spaces, dashes, dots and brackets are allowed. `00` works in place of `+`. Numbers without a country code are ignored. | `"+20 100 000 0000"` |
| `whatsappNumber` | Same format as `phone`. It is **not** copied from `phone` automatically, so WhatsApp appears only if you choose to publish it. | `"+20 100 000 0000"` |
| `email` | Plain address | `"name@example.com"` |
| `teamsUrl` | `https://` link on `teams.microsoft.com`, `teams.live.com` or `teams.cloud.microsoft` | `"https://teams.microsoft.com/l/chat/0/0?users=name@example.com"` |
| `linkedinUrl` | `https://` link on `linkedin.com` | `"https://www.linkedin.com/in/your-handle"` |
| `mapsUrl` | Any `https://` maps link, such as a Google Maps or Bing Maps share link | `"https://maps.app.goo.gl/…"` |
| `websiteUrl` | Optional `https://` URL | |
| `cardUrl` | Optional. The public HTTPS address of this site. When empty, the deployed card uses its own address for the QR code and Copy/Share. Needed for canonical/social-preview URLs. | `"https://<user>.github.io/<repo>/"` |
| `photoUrl` | Local path to the headshot | `"./assets/mina.jpg"` |
| `bio`, `expertise` | Arrays of strings | |

Values that fail validation (for example `http://`, `javascript:` or a LinkedIn URL on another domain) are hidden rather than shown as broken buttons.

**Teams link:** `https://teams.microsoft.com/l/chat/0/0?users=<work-address>` opens a chat with that person. Use it only if Mina approves publishing that address.

### Replacing the profile photo

1. Add a square image (at least 512×512, JPEG or WebP, ideally under 150 KB) to `assets/`, for example `assets/mina.jpg`.
2. Set `photoUrl: "./assets/mina.jpg"` in `src/profile.js`.
3. Optionally add it to `PRECACHE_URLS` in `sw.js` for offline use.

If the image is missing or fails to load, the card falls back to `assets/profile-placeholder.svg`. Remote photo URLs are blocked by the Content Security Policy on purpose.

### Icons and social image

Edit `assets/icons/icon.svg`, `icon-maskable.svg` or `assets/og-image.svg`, then run `npm run icons` to regenerate the PNGs.

## How Save to Contacts works

The browser builds a vCard 3.0 file (the most widely supported version), escaping backslashes, commas, semicolons and newlines and folding long lines. It then downloads it as `mina-atalla.vcf` from a temporary object URL, which is revoked afterwards. The file includes the name, title, organisation, mobile, work email, website, LinkedIn, location and a note naming this card as the source, but only for fields that are set.

- **iPhone (Safari):** a contact preview opens; the visitor taps **Create New Contact** or **Add to Existing Contact**.
- **Android (Chrome):** the file downloads; opening it hands it to the Contacts app, which asks for confirmation.
- A website **cannot add a contact silently**. The card says the phone may ask for confirmation.
- If neither a phone number nor an email is configured, the button shows a setup message instead of creating an empty card.

## How the QR code works

The QR code is generated in the browser (byte mode, error correction level M) and drawn as a black-on-white SVG with the standard 4-module quiet zone, in both themes. No image or network request is involved. What it contains depends on the configuration:

| Situation | QR contains | Dialog shows |
| --- | --- | --- |
| `cardUrl` set to a valid `https://` URL | That URL | "Scan to connect with Mina", the URL, Copy Link, Share |
| `cardUrl` empty and the card is served over `https://` (any deployment) | The page's own address (query and hash removed) | Same as above, so scanning opens the card |
| Local `http://` preview, with a phone or email configured | A compact vCard (name, company, title, phone, email) | "Scan to save Mina's contact" |
| None of the above | Nothing | A setup message |

So once deployed, the QR code opens the card itself with no extra configuration. Set `cardUrl` only to force a specific address (for example a custom domain) or to add canonical/social-preview URLs at build time.

## Themes

The default is **System**, which follows the device's light/dark setting and updates live. Choosing Light or Dark is saved in `localStorage`; choosing System clears it. If storage is blocked, the choice still applies for the current visit. `src/theme-init.js` runs before the stylesheet so there is no flash of the wrong theme.

## PWA behaviour

- `manifest.webmanifest` uses relative `start_url`/`scope`, so it works at a domain root or a sub-path (GitHub Pages project sites).
- An **Install card** button appears only when the browser fires `beforeinstallprompt` (Chromium browsers). On iOS, use Share → *Add to Home Screen*.
- The service worker registers **only on `https://`** origins, so local `http://` development is never cached.
  - Page navigations are network-first, so a new deployment shows up on the next online visit.
  - Other same-origin files are served from cache and refreshed in the background. Each build gets a new cache name, and old caches are deleted.
  - External links and cross-origin requests are never cached.
- **To clear it while testing a deployment:** DevTools → Application → Service workers → *Unregister*, then *Clear site data*. To disable it, remove the `registerServiceWorker()` call in `src/app.js`.

## ⚠️ Privacy

Everything in `src/profile.js` and `assets/` is **public as soon as the site is published**, and it stays in the git history even if removed later. The phone number, email, Teams link, office location and profile links are personal information. Publish only values Mina has explicitly approved. The repository ships with these fields empty on purpose.

The site sets no cookies, includes no analytics or trackers, collects nothing from visitors and makes no third-party requests until a visitor taps an external link.

## Deploying to GitHub Pages

1. Push this folder to a GitHub repository (default branch `main`).
2. Under **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**.
3. Set `cardUrl` in `src/profile.js` to `https://<user>.github.io/<repo>/` (or your custom domain), then commit.
4. The **Test and deploy to GitHub Pages** workflow runs the checks, builds `dist/` and deploys it. It needs no secrets and uses least-privilege permissions.

### Other static hosts

Run `npm run build` and upload the **`dist/`** folder to Azure Static Web Apps, Netlify, Cloudflare Pages, S3 + CloudFront or any web server. The build has no dependencies; `node scripts/build.mjs` is enough. The repository root also works without building, but then the service-worker cache version isn't stamped and the social URLs aren't injected.

Serve over HTTPS. Clipboard, Web Share, the service worker and installation all require it.

## Known platform limitations

- **vCard import** always needs the user's confirmation. Some Android browsers only download the file and the user must open it from notifications or Downloads.
- **In-app browsers** (LinkedIn, Teams, Instagram) may block downloads, `tel:` links or Web Share. Visitors can use *Open in browser*.
- **Web Share** is unavailable in most desktop Firefox builds and some Linux browsers, so the button is hidden there.
- **Clipboard** needs HTTPS; the fallback uses `document.execCommand("copy")`, and if that also fails the URL is selected for manual copy.
- **WhatsApp/Teams** links open the app only if it's installed; otherwise the web version opens.
- **Install prompt** isn't available on iOS or Firefox. iOS uses *Add to Home Screen*.
- `og:image` needs an absolute URL. It's added only when `cardUrl` is set and the site is built.
- On the System theme, the iOS status-bar colour follows the system setting rather than a manual override.

## Pre-publication checklist

- [x] Phone (`+20 100 099 9577`) and email (`minaatalla@microsoft.com`) set
- [ ] Fill in or leave empty: WhatsApp, Teams, LinkedIn, maps, website
- [ ] Confirm Mina has approved every published contact field
- [ ] Replace the placeholder photo with an approved headshot
- [ ] Confirm the job title is the one Mina wants shown
- [ ] Use an HTTPS public URL and set `cardUrl` to the final deployed URL
- [ ] Run `npm run check` and confirm all checks pass
- [ ] Rebuild and verify social-preview metadata (for example with the LinkedIn Post Inspector)
- [ ] Test QR scanning from a second physical device
- [ ] Test vCard import on an iPhone
- [ ] Test vCard import on an Android phone
- [ ] Verify the Teams and LinkedIn links
- [ ] Verify that Maps opens the right location on iOS and Android
- [ ] Confirm no secrets exist in the repository history (`git log -p | grep -iE "key|token|secret|password"`)
