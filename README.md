# Gather

A complete chat application in **one Next.js project**. Frontend pages, API routes, and authenticated Socket.IO connections share port 3000. MongoDB stores accounts, sessions, friendships, conversations, messages, and uploaded files. Express, Sequelize, and PostgreSQL are no longer runtime dependencies.

## Step 1 — Run with Docker

Start Docker Desktop, then run from this directory:

```sh
docker compose up --build -d
```

Open **http://localhost:3000** and create an account. Use a second browser or private window for another account to try live chat and friend requests.

```sh
docker compose logs -f app
docker compose ps
docker compose down
```

The `mongo_data` named volume preserves records and uploaded files. MongoDB is available only inside the Docker network by default. `docker compose down` preserves the volume; adding `-v` would delete it.

### Optional demo data

Create six demo users, four direct chats, three groups, owner/admin/member roles, requests, group invitations, read/unread messages, and shared files:

```sh
docker compose exec -e DEMO_PASSWORD=GatherDemo123! app node scripts/seed.mjs
```

Sign in as **jamie@example.com**, password **GatherDemo123!**. Other demo usernames: `alex`, `sam`, `morgan`, `priya`, and `casey`, with the same initial password. Existing passwords and edits are preserved. See [the complete seed data guide](docs/SEED_DATA.md) for account details, friendships, groups, roles, invitations, files, commands, and rerun behavior.

## Step 2 — Develop locally

Use Node.js 22 or newer. Start just MongoDB through Docker:

```sh
docker compose -f compose.yaml -f compose.dev.yaml up -d mongo
npm install
```

Copy `.env.example` to `.env.local`:

```powershell
Copy-Item .env.example .env.local
```

```sh
npm run dev
```

On Windows, use `npm.cmd` if PowerShell blocks `npm.ps1`. Stop the Docker app first if port 3000 is already occupied:

```sh
docker compose stop app
```

Production outside Docker:

```sh
npm run build
npm start
```

The custom server is required for Socket.IO. Use these scripts instead of running `next dev` or `next start` directly.

## Step 3 — Project structure

```text
src/
  app/
    api/                      # Separate Next.js endpoint files
      auth/                   # Register, login, logout, password reset
      me/                     # Profile and password management
      people/                 # User discovery
      friends/                # Requests, accept, decline, remove, block
      conversations/          # Direct/groups, messages, receipts, flags
      groups/                 # Group details, admins, members, pending invitations
      group-invitations/      # Incoming invitations and accept/decline actions
      files/                  # Upload and authorized download
      health/                 # Database readiness
    styles/                   # Base, auth, workspace, features, responsive CSS
    layout.js
    page.js
  components/
    auth/
    chat/                     # Chat view, bubble, composer, details
    friends/
    groups/
    layout/                   # Workspace, navigation, conversation sidebar
    settings/                 # Separate profile, preferences, security forms
    ui/                       # Shared avatar, dialog, empty state
  hooks/                      # Session, directory, messages, socket, recorder
  server/
    models/                   # One MongoDB schema per file
    services/                 # One API operation per file, grouped by feature
    realtime/                 # Separate socket authentication/event functions
    http.mjs                  # Shared request handling and errors
  lib/                        # Database, auth, validation, formatting utilities
    chat/                     # Membership, serialization, send, notify
scripts/
  seed.mjs
  migrate.mjs
  migration/
tests/
server.mjs                    # One HTTP server for Next.js and Socket.IO
Dockerfile
compose.yaml
compose.dev.yaml
```

Route files delegate to focused server functions. Components handle presentation; hooks handle state and effects. Database connections are reused across requests and development reloads.

## Features

- Registration and login by username/email; HTTP-only cookie sessions and logout.
- Password changes invalidate all sessions; SMTP reset links expire after 30 minutes.
- Public name/photo/bio/status and private contact details; persistent light/dark theme and sound preferences.
- User discovery, friend requests, accept/decline/cancel, remove, block/unblock.
- Persistent direct/group chats with dedicated group services: edit names/descriptions/photos, add friends, remove members, promote/demote multiple admins, transfer ownership, and leave groups. Owners control admin roles; admins can edit groups and manage ordinary members.
- Group invitations expire after seven days. Invite friends, accept/decline from Groups, and review or cancel pending invitations from group management. Private message history and files remain inaccessible until membership is granted.
- Per-conversation mute controls and paginated shared-file browsing. Group and conversation controls are available from the details panel on mobile too.
- Authenticated Socket.IO messages, HTTP fallback, idempotent retries, multiple-tab presence, typing, read receipts, unread counts.
- Paginated history, search within loaded messages, per-user pinning/archiving. Incoming messages restore archived conversations.
- Images, audio, PDFs, and text files up to 8 MB, persisted as MongoDB binary data with authorized downloads.
- Voice recording with stop/cancel and microphone cleanup; requires localhost or HTTPS.
- Responsive screens, mobile navigation, accessible labels, native keyboard-friendly dialogs, reduced-motion support.

## Step 4 — Import PostgreSQL records

The new storage engine does not automatically copy existing data. The importer reads a JSON export and never changes the source PostgreSQL database. Keep a backup.

Export these tables through your PostgreSQL tool:

```sql
SELECT COALESCE(json_agg(u), '[]'::json) FROM users u;
SELECT COALESCE(json_agg(f), '[]'::json) FROM friends f;
SELECT COALESCE(json_agg(c), '[]'::json) FROM chats c;
-- Optional, if populated:
SELECT COALESCE(json_agg(g), '[]'::json) FROM groups g;
```

Combine the arrays into a private file:

```json
{
  "users": [],
  "friends": [],
  "chats": [],
  "groups": [],
  "attachments": []
}
```

Keep the original Sequelize column names, including `userName`, `firstName`, `senderId`, and the bcrypt `password` hashes. UUIDs map to MongoDB ObjectIds; passwords, message timestamps, and read status are preserved. Already-imported records are skipped. Account conflicts stop the importer. Earlier records may have been imported before an error; resolve the issue and rerun the same export.

```sh
npm run migrate -- data-export.json
```

To import into Docker:

```sh
docker compose cp data-export.json app:/tmp/data-export.json
docker compose exec app node scripts/migrate.mjs /tmp/data-export.json
```

Legacy file paths are not portable. Optional `attachments` entries accept `messageId`, `name`, `mime`, and `base64` for old voice files. Missing voice files and profile images are counted as skipped; upload profile photos again. Sessions are not imported, so users sign in again. The old Groups UI kept sample groups only in browser memory; those cannot be recovered from the database.

## Step 5 — Verify

```sh
npm test
npm run build
npm run test:integration
npm run test:seed
npm run test:ui
npm run format:check
```

Integration tests require MongoDB on `127.0.0.1:27017` and a production build. They start port 3100, use a uniquely named test database, and delete only that database afterward. They test auth, permissions, WebSocket persistence/broadcast, typing, receipts, files, groups, pagination, blocking, logout, and migration.

Browser tests require the app on port 3000 and Chromium:

```sh
npx playwright install chromium
npm run test:ui
```

Browser tests create test users and conversations in the app database. Screenshots go to ignored `test-results/`.

## Configuration and hosting

See `.env.example`. Set `APP_URL` to the exact browser-facing origin. Set `COOKIE_SECURE=true` behind HTTPS. Configure `SMTP_HOST`, `SMTP_PORT`, optional SMTP credentials, and `SMTP_FROM` to enable reset email; without SMTP the app explains that email reset is unavailable.

Deploy to hosting that supports a persistent Node.js server and WebSocket upgrades. A reverse proxy must forward `/socket.io/` upgrades and normal HTTP requests to the same app. This version supports one app instance; multiple replicas require a shared Socket.IO adapter and suitable load balancing. The default Compose file is for local or single-host use. Use an authenticated MongoDB service and backups for public production hosting.

The root is the only active application. The previous three directories are preserved in `legacy/` for reference and are excluded from the Docker image; the new app never imports them.
