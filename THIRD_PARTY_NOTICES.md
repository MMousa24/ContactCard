# Third-party notices

## QR Code encoder — `src/vendor/qrcode.js`

"QRCode for JavaScript", Copyright (c) 2009 Kazuhiko Arase. Licensed under the MIT License
(http://www.opensource.org/licenses/mit-license.php).

The module split used for bundling comes from qrcode-terminal 0.12.0
(https://github.com/gtanner/qrcode-terminal, Apache License 2.0). The encoding algorithm is
unmodified; it was wrapped into a single ES module.

The word "QR Code" is a registered trademark of DENSO WAVE INCORPORATED.

## Development-only dependencies (not shipped to the site)

- Playwright — Apache License 2.0 — browser tests and icon rasterisation.
- @zxing/library — Apache License 2.0 — decodes the rendered QR code in tests.
