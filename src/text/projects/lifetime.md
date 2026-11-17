---
title: Lifetime
img: /assets/lifetime.svg
img_alt: "The Lifetime icon: a ring with a gap where a yellow dot orbits, around a small satellite"
badge: Pilot deployments
description: |
  Software for Windows and Linux that measures how long each computer is really awake, and brings every computer in a
  school or office onto one dashboard. Open source, and deployed in Vietnam by COBACOM.
order: 2
---

## What it is

Lifetime has two parts. The **Lifetime desktop app** runs on each Windows or Linux computer and counts that computer's real awake time from inside the machine, not by guessing from network pings. **Lifetime Server** runs on one Windows or Linux server or PC, collects the data from every computer and shows them all on one dashboard.

It speaks Vietnamese and English, and comes in two styles (Glass and Classic) with light and dark themes. It's open source under the GPL-3.0 licence: [the code is on GitHub](https://github.com/jpl-innovation/Lifetime). [COBACOM](https://www.cobacom.com/vi) deploys and supports it for schools and offices in Vietnam.

![The Lifetime desktop app's Overview: total awake time, the current and longest sessions, and the last 14 days](/assets/lifetime/overview.webp)

## Counting you can trust

- Each computer counts its own awake time. If the network or the server goes down, it keeps counting and sends the data later.
- Time when the server itself was off is shown as **Unknown**, never counted as online or offline.
- Every computer gets a health score from 0 to 100, with the breakdown that explains it. A part with no data is Unknown, not counted as good or bad.

![The desktop app's Activity page: a calendar of awake hours, daily awake hours, the lifetime total and the hour-of-day profile](/assets/lifetime/activity.webp)

## One dashboard for the whole fleet

- The Overview counts the computers that are Online, Offline, have no report yet, or are waiting for approval. Click any of them to see which computers they are.
- The device list has status chips, a 24-hour online timeline, and CPU and RAM trends.
- Each device has its own page: its hardware (CPU, RAM, disks with capacity bars, battery), an activity and health summary, and its events.
- Alert rules, expected-online hours, maintenance windows, an incident list with acknowledge, and email alerts over secure SMTP (STARTTLS). An optional HTTPS webhook can feed chat tools through a bridge.
- Monthly availability reports as PDF and CSV, for one computer, a group or the whole site, keeping awake time, availability and Unknown time apart.
- Network checks for printers, routers and websites (ping, TCP port, HTTP), with nothing installed on them.

![A device's page on Lifetime Server: its hardware, activity, health and events](/assets/lifetime/server-device.webp)

## Safe to run

Lifetime is built to be trusted with a whole school or office. Every protection below is written up in full in the code's [security notes](https://github.com/jpl-innovation/Lifetime/blob/main/SECURITY.md).

- **Nothing joins on its own**: computers join with a one-time code, or are installed silently on many at once (GPO or Intune), and then wait for an admin's approval. Codes expire after 24 hours, can be limited to a number of uses or cancelled, are stored only as hashes, and lock after five wrong guesses.
- **Talks only to its own server**: encrypted connections (TLS 1.2 or newer) pinned to the server's own key. A server with any other key is refused before anything is sent, and an address found on the network is only a hint, never trusted on its own. Certificates renew themselves without pairing again.
- **Administration stays on the server**: the admin side is reachable only on the server itself (a Windows named pipe, or a Linux socket that knows which account is asking), never over the network. Web pages can't reach it, or the computers' live connection.
- **Four roles, denied by default**: Windows accounts, or Linux users and groups, are Admin, Operator, Auditor or Viewer. An account without a role can do nothing.
- **Remote power only with the owner's permission**: Sleep, Restart, Shut down and Turn on (Wake-on-LAN), one computer at a time and only if its owner allowed remote power control. Restart and Shut down warn the person at the computer a minute before on Windows and most Linux systems. A command expires after ten minutes; at most three per computer and ten per account in ten minutes; removing a role cancels its waiting commands.
- **A record that can't be quietly changed**: every change and every refused request goes into an audit trail where each entry carries a fingerprint of the one before it, so **Verify audit trail** finds any entry that was edited, removed or reordered.
- **No logs of what people do**: no request or access logs. The server log keeps starts, stops and refused requests by kind only, with no contents, codes, passwords or IP addresses.
- **Safe with what other computers send**: a computer's name and hardware details are always shown as plain text, never run as web code, and a report with any field outside the allowed list is rejected whole.
- **Updates only when the owner says so**: agent updates are off by default. The server accepts a package only if its SHA-256 checksum matches the published one, each computer checks it again (and its signature on Windows), and the agent never runs the package itself.
- **Secrets kept secret**: the email password and webhook address are encrypted on Windows (readable only by the server's own account on Linux), kept out of the database and backups, and email goes out only over an encrypted connection.
- **Backups locked down**: readable only by administrators, never holding the admin token or the email password, and checked file by file before a restore.
- **Network checks that stay in bounds**: printers, routers and websites are checked only inside the networks the admin allows, and addresses with a password in them are refused.
- **A locked-down server on Linux**: it runs under its own account without admin rights, inside the system's service sandbox; the container runs without root and never exposes the admin port.
- **Open to checking**: the code is public, and security problems can be reported privately on GitHub.
- **Light on resources**: in testing, the server used about 1.8% CPU and about 61 MB of memory with 50 simulated computers. A server that stops restarts itself, on Windows and on Linux.

## Privacy

Each computer's owner or user chooses what to share with sharing switches, and nothing beyond that is sent. Lifetime never records screens, keystrokes, browsing or file contents: only awake time, device health and hardware information. All the data stays on the customer's own server, on their own network. There is no cloud service.

## New in version 1.2.0

Released on 17 November 2026. It adds:

- **Linux**: the desktop app as one download for most Linux distributions (Ubuntu, Debian, Fedora, RHEL and others), and Lifetime Server for Linux on x86_64 or ARM, or as a container.
- **Server status on the desktop app**: a computer connected to a Lifetime Server shows whether the server can be reached, and that its awake time keeps counting while it can't. A computer used on its own shows nothing about servers.
- **Groups ahead of time**: create groups before any computer is in them, put a computer in a group when approving it, and edit all of a computer's details in one place.
- **Energy and cost**: kWh and money (in VND by default, with an editable price per kWh) worked out from real awake hours. Measured where a computer reports real power readings, and estimated from a typical wattage the admin sets otherwise.
- **Left on after hours**: which computers stayed awake outside school or office hours, and how much energy and money that wasted. An optional per-group policy sends the normal Sleep command only to computers whose owner allowed it, and stops if someone is using the computer.
- **Replacement plan**: when each battery wears out and each disk fills up, forecast from that computer's own history, or "not enough data" when there is too little.

![Lifetime Server's Energy page: energy and cost today, for the last 7 and 30 days, energy per day and the top consumers, each marked as measured on battery or estimated, with the product's own demo computers](/assets/lifetime/server-energy.webp)

## Where it is now

The current public version is 1.2.0. Pilot deployments, with testing on real customer machines in progress. The server runs on Windows Server, a Windows 10/11 PC or Linux; the computers run Windows 10/11 or Linux. The Linux versions are new in 1.2.0: they have been tested in containers on 11 distributions, not yet on real customer machines. [Downloads and user guides in English and Vietnamese](https://github.com/jpl-innovation/Lifetime/releases/latest) are on GitHub.
