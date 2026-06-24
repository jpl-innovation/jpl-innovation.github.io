<!-- Copilot / AI agent instructions for the JPL Innovation website repo -->
# Assistant Guide — JPL Innovation (static site)

This repository is a small static website (no build system). The goal of these instructions is to help AI coding agents quickly become productive editing, testing, and extending the site.

Key facts (big picture)
- Project type: static HTML/CSS/JS website. No Node/npm or build steps present.
- Pages: top-level HTML files (e.g. `index.html`, `projects.html`, `vision.html`, `jayden-*.html`, `khoa-*.html`).
- Shared fragments: `elements/header.html` and `elements/footer.html` are injected client-side by `js/script.js`.
- Assets: styles in `css/` (primary file: `css/style.css`), scripts in `js/`, images in `image/`.

Important technical patterns (do not break these)
- Header/footer are inserted dynamically: `js/loadHTML()` fetches `elements/header.html` into the page element with id `top-bar-thing` and `elements/footer.html` into `bottom-bar-thing`. Because this uses `fetch()` it will fail over `file://`—serve the site over HTTP when testing.
  - Example: `loadHTML("top-bar-thing", "elements/header.html");`
- Navbar link highlighting: `js/script.js` uses the `data-page` attribute on nav links inside the loaded header to mark the active page. When editing the header, ensure each `<a>` has `data-page="<filename>"` (e.g. `data-page="index.html"`).
- Responsive dropdown submenu: `elements/header.html` uses nested `.dropdown-submenu` markup and `css/style.css` contains the CSS to display nested dropdowns on hover for pointer devices.

Dev / test workflow (how to run & debug locally)
- Serve with a simple HTTP server (required so `fetch()` can load `elements/*.html`):
  - `python3 -m http.server 8000` then open `http://localhost:8000`
  - Or use VS Code Live Server extension.
- Edit `elements/header.html` or `elements/footer.html` to change navigation/site chrome. After changing header/footer, refresh the served page.
- CSS is centralized in `css/style.css`. Use the CSS variables defined in `:root` (e.g. `--primary`, `--secondary`) when adding colors to match the theme.

Conventions & patterns to follow
- Page naming: person-specific pages use the prefixes `jayden-` and `khoa-` (e.g. `jayden-about.html`). Follow the same naming when adding new member pages.
- Navbar updates: update `elements/header.html` (not each page) so all pages receive the change via the runtime include. Keep `data-page` attributes correct to preserve active highlighting.
- Adding pages: include the `top-bar-thing` and `bottom-bar-thing` placeholders, and include the same local CSS/JS links as other pages. Example minimal structure (top of a new page):
  - `<link rel="stylesheet" href="css/bootstrap.min.css">` etc. and `<div id="top-bar-thing"></div>` where the header will be injected.

Files worth checking for context
- `js/script.js` — dynamic loading of `elements` and small UX helpers (nav highlight, header hide-on-scroll).
- `elements/header.html` and `elements/footer.html` — update these to change site-wide header/footer.
- `css/style.css` — project theme variables and custom styles (primary cyan: `--primary: #4fc3f7`).
- `css/bootstrap*.css` and `js/bootstrap*.js` — local bootstrap distribution is checked into the repo; prefer those local files (not CDN) when adding new components.

Edge-cases & gotchas discovered
- Because header/footer are loaded via `fetch`, opening `index.html` via the `file://` protocol will not load them. Always use an HTTP server for testing.
- Multiple bootstrap files exist; use the `css/bootstrap.min.css` and `js/bootstrap.bundle.min.js` that are already referenced by the pages to avoid version mismatch.

Editing guidance for agents
- Minimal, targeted edits: change `elements/header.html` to modify global nav; change `css/style.css` to alter visuals.
- When adding interactive behaviors, add code to `js/script.js` keeping helper functions small and names descriptive (`initScrollHeader`, `highlightActiveLink`). Avoid changing the existing loader behavior unless you update all pages and document the change here.

If unsure, ask the user about
- Whether new pages should follow the existing naming convention (`jayden-`, `khoa-`).
- Preferred workflow for serving (Live Server vs. python HTTP server).

End of instructions — please propose edits or point out missing info.
