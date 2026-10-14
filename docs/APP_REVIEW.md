# Chat application review

Reviewed on 14 October 2026. This is a functioning, responsive chat application for local or single-instance hosting. The core features are implemented. Public deployment still needs environment, security, and operational configuration, and some useful product features remain optional.

## Existing features

| Area                                                                     | Status                                   |
| ------------------------------------------------------------------------ | ---------------------------------------- |
| Register, username/email login, logout, cookie sessions                  | Implemented                              |
| Password changes and session invalidation                                | Implemented                              |
| Email reset links                                                        | Implemented; requires SMTP configuration |
| Profiles, avatars, status, theme and sound preferences                   | Implemented                              |
| User search, friend requests, accept/decline/cancel, block/unblock       | Implemented                              |
| Persistent direct and group messaging                                    | Implemented                              |
| Socket.IO, HTTP fallback, idempotent retries, typing and presence        | Implemented                              |
| Read receipts, unread counts and paginated history                       | Implemented                              |
| Pin, archive, mute and shared-file browsing                              | Implemented                              |
| Images, audio, PDF/text attachments and voice recording                  | Implemented; uploads limited to 8 MB     |
| Group names/descriptions/photos, add/remove members                      | Implemented                              |
| Group owners, multiple admins, role changes, ownership transfer, leaving | Implemented                              |
| Group invitations, accept/decline/cancel, seven-day expiry               | Implemented                              |
| MongoDB, Docker, health checks, persistent volume                        | Implemented                              |
| Seeder, sample users/groups/messages/files and Markdown guide            | Implemented                              |

## Issues corrected during this review

1. **Messages marked read on another screen:** read handling now runs only when the conversation is displayed and the document is visible. Visiting Settings or Friends no longer silently clears a selected conversation’s unread messages.
2. **History scroll jumps:** prepending history preserves the reading position. Read-receipt updates do not force a jump to the bottom. Incoming messages keep a user’s position when they are reading earlier history.
3. **Pagination duplicates:** repeated requests for the same older page are guarded; messages are deduplicated and stale responses cannot replace another conversation’s state.
4. **Reconnect history gaps:** reconnect reloads the latest contiguous page, retaining only relevant messages received during the fetch. Earlier pages remain available through pagination.
5. **Late microphone permissions:** if permission resolves after leaving chat, its track is immediately released. Duplicate permission requests are prevented, and the recording time limit no longer stops the recorder inside a React state updater.
6. **Phone ergonomics:** composer buttons have 44 px targets, inputs use 16 px text, long headings truncate, and bottom navigation accounts for device safe areas. The viewport requests content resizing for virtual keyboards on supporting browsers, and the emoji control remains available on narrow phones.

## Mobile support and verification

The app supports responsive phone and tablet browser layouts. Automated Chromium checks exercise these sizes:

| Width × height | Coverage         |
| -------------- | ---------------- |
| 320 × 568      | Small phone      |
| 360 × 740      | Phone            |
| 390 × 844      | Phone            |
| 430 × 932      | Large phone      |
| 768 × 1024     | Tablet portrait  |
| 1024 × 768     | Tablet/landscape |

Checks cover chat navigation, horizontal overflow, input readability, composer visibility with a shortened viewport, group management dialogs, friends, and settings. Separate desktop tests cover real account flows, group permissions, invitations, file messages, preferences, and logout. Regression tests cover unread state on inactive views, earlier-message scrolling, reconnect gaps, and microphone cleanup.

These checks use browser automation. Real iPhone Safari and Android Chrome hardware, on-screen keyboard behavior, microphone hardware, and background/resume behavior still need device testing before a broad release. A shortened test viewport is a layout check, not a substitute for a physical keyboard test.

### Open the app on a physical phone

- A deployed HTTPS address is the preferred way to test the full app on a phone.
- For local text-chat testing, the phone and computer must be on the same reachable network. Use the computer’s LAN address, such as `http://<computer-IP>:3000`, rather than the phone’s `localhost`.
- Set `APP_URL` to that exact browser-facing origin and recreate the app service. Its API and Socket.IO origin checks intentionally reject a different configured origin.
- Voice recording requires a secure context and microphone permission. A plain HTTP LAN address generally does not provide that; use HTTPS for full phone recording tests. [MDN getUserMedia security requirements](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#privacy_and_security)

## Configuration still needed for a public deployment

| Priority      | Item                                                     | Current state                                                                                                                       |
| ------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Before launch | HTTPS, real domain, exact `APP_URL`, secure cookies      | Current demo uses localhost HTTP and `COOKIE_SECURE=false`                                                                          |
| Before launch | Authenticated MongoDB credentials and backups            | Default Compose is a private Docker-network development database with a persistent volume, but no DB credentials or backup schedule |
| Before launch | SMTP settings                                            | Reset emails cannot be delivered without them                                                                                       |
| Before launch | Remove/disable demo accounts in the public database      | Seeder is intended for development                                                                                                  |
| Before launch | Physical mobile/browser testing                          | Automated browser coverage is present; hardware testing remains                                                                     |
| Before launch | Logging, monitoring, storage limits and restore testing  | Basic health checks/logs exist; these operational policies are not configured                                                       |
| If scaling    | Shared Socket.IO adapter and load-balancer configuration | Live presence/broadcast currently use one app instance                                                                              |

Next.js recommends a reverse proxy when self-hosting, and Socket.IO documents the additional requirements for multiple nodes. [Next.js self-hosting guide](https://nextjs.org/docs/app/guides/self-hosting), [Socket.IO multiple-node guide](https://socket.io/docs/v4/using-multiple-nodes/)

## Useful next features

These are suggestions based on the current source, not implemented features or requirements for the existing demo:

| Priority | Feature                                              | Why it helps                                                                |
| -------- | ---------------------------------------------------- | --------------------------------------------------------------------------- |
| First    | Reply to a specific message                          | Adds context in active groups                                               |
| First    | Edit/delete your own messages                        | Correct mistakes, with clear ownership rules and realtime updates           |
| First    | Search across full history                           | Current search filters only messages already loaded in the browser          |
| Next     | Persistent conversation drafts                       | Avoid losing text while switching conversations                             |
| Next     | Push notifications/PWA installation                  | Better phone use when the app is not open                                   |
| Next     | Per-member group read details and last-seen controls | More useful receipts and privacy choices                                    |
| Later    | Reactions, bookmarks, account data export/deletion   | Convenience and account lifecycle controls                                  |
| Later    | Voice/video calling                                  | A larger separate feature requiring call signaling and media infrastructure |

The app does not currently provide end-to-end message encryption. If that is a product requirement, it needs a dedicated design for keys, devices, attachments, and recovery; it should not be represented as already available.

## Reproduce browser checks

With the Docker application running on port 3000:

```sh
npm run test:ui
npm run format:check
```

Focused review checks:

```sh
npx playwright test tests/browser/chat-review.spec.mjs
```

Screenshots are written to ignored `test-results/`. Browser tests create fictional accounts and conversations in the local app database.
