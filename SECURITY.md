# Security and privacy: the JPL Innovation website

## Reporting a problem

Please report security problems privately: on GitHub, open this repository's **Security** tab and choose
**Report a vulnerability**. Please don't open a public issue for a security problem. For anything else, email
jpl.innovation05@gmail.com.

## What the site is

Static pages on GitHub Pages. There is no server of ours, no database, no login and no form that sends data
anywhere. "Let's talk" only shows our email address or opens your own mail app.

## What the site keeps about you

- **No cookies, no analytics, no tracking.** No advertising or measuring scripts, and no requests to other sites:
  fonts, pictures and 3D models are served by the site itself.
- **Only your own choices, only in your own browser:** theme (Light or Dark), style (Glass or Solid), Classic or 3D,
  3D quality, and whether the openings were already played (the logo intro, and a landing game's best score, are only
  ever kept for the open tab). Nothing is ever sent anywhere.
- **You decide whether they are remembered:** Settings (the gear at the top) > **Remember my choices on this device**.
  - **On** (the default): kept in this browser's local storage until you change them or clear the site's data.
  - **Off**: everything already kept is moved out at once and kept only until you close the tab (session storage).
    The browser keeps one word, `no`, so the site doesn't start remembering again on your next visit.
  - Clearing this site's data in your browser removes everything, the `no` included.

## How the pages are kept safe

Checked on every change by `npm run tidy` (`scripts/audit-security.py`); the rules are in `docs/CLEANUP.md`:

1. Nothing a visitor types or links to becomes markup; text is written as text, and the few places that must build
   HTML escape every outside value.
2. No code from other sites: no outside scripts, frames, stylesheets or requests.
3. Text never becomes code: no `eval`, `new Function`, `document.write` or string timers.
4. The address and stored values are data: they are compared to fixed lists, never put into the page.
5. Links that open a new tab carry `rel="noopener noreferrer"`.
6. Dependencies are kept few, `package-lock.json` is committed, and install scripts run only for allowed packages.
7. No tokens, passwords or keys in the repository, the pages or the commit messages.

What protects the live site itself is the GitHub account: two-factor sign-in on every account that can publish, as
few people with access as possible, and no long-lived access tokens.
