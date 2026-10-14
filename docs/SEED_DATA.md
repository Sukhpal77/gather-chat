# Demo seed data guide

The seeder creates a complete fictional dataset for exploring Gather: accounts, profiles, friendships, direct messages, group roles, invitations, unread/read messages, archived/muted conversations, and shared files. It does not contact anyone or send emails.

## 1. Run the seeder

### Docker

From the repository root:

```sh
docker compose up --build -d
docker compose exec -e DEMO_PASSWORD=GatherDemo123! app npm run seed
```

Open **http://localhost:3000**. Refresh the page if it was already open; the seeder writes directly to MongoDB rather than broadcasting live UI updates.

### Local development — PowerShell

```powershell
docker compose -f compose.yaml -f compose.dev.yaml up -d mongo
npm.cmd install
if (-not (Test-Path -LiteralPath '.env.local')) { Copy-Item .env.example .env.local }
$env:DEMO_PASSWORD = 'GatherDemo123!'
npm.cmd run seed
Remove-Item Env:DEMO_PASSWORD
npm.cmd run dev
```

Copy the environment example only if `.env.local` does not already exist. Otherwise keep your existing settings. Stop the Docker app before running the local app on the same port: `docker compose stop app`.

### Local development — bash

```sh
DEMO_PASSWORD='GatherDemo123!' npm run seed
```

The local seeder reads `MONGODB_URI` from `.env.local`/environment, falling back to `mongodb://127.0.0.1:27017/gather`. Docker uses its internal `mongo` service. The app and seeder must point to the same database.

`DEMO_PASSWORD` is required. New users share this password, hashed with bcrypt; it is never stored as plain text. Choose at least eight characters and no more than 72 UTF-8 bytes. Existing accounts retain their current passwords, even if you supply a different value on a later run.

## 2. Demo users and login details

On a fresh seed using the command above, **all six users have password `GatherDemo123!`**. Sign in with either the email or username.

| Name         | Username | Email                | Location         | Main scenario                                                         |
| ------------ | -------- | -------------------- | ---------------- | --------------------------------------------------------------------- |
| Jamie Lee    | `jamie`  | `jamie@example.com`  | Pune, India      | Main chat workspace; weekend owner; incoming/outgoing friend requests |
| Alex Rivera  | `alex`   | `alex@example.com`   | Bengaluru, India | Weekend admin; blocked-person list; design member                     |
| Sam Chen     | `sam`    | `sam@example.com`    | Mumbai, India    | Design owner; weekend member; sends Morgan a group invitation         |
| Morgan Ellis | `morgan` | `morgan@example.com` | Delhi, India     | Pending friend request to Jamie; incoming Design circle invitation    |
| Priya Shah   | `priya`  | `priya@example.com`  | Ahmedabad, India | Design admin; reading owner; incoming weekend invitation              |
| Casey Brooks | `casey`  | `casey@example.com`  | Hyderabad, India | Incoming friend request from Jamie; blocked by Alex                   |

These names and accounts are fictional. All emails use `example.com`; phone numbers use the fictional `202-555-01xx` range.

### Profile information

| Username | Status                      | Bio                                                   | Private sample phone |
| -------- | --------------------------- | ----------------------------------------------------- | -------------------- |
| `jamie`  | Coffee & good conversations | Making things, taking the scenic route.               | +1 202-555-0101      |
| `alex`   | Available                   | Design, weekend hikes, and a good flat white.         | +1 202-555-0102      |
| `sam`    | Working on something good   | A little curiosity goes a long way.                   | +1 202-555-0103      |
| `morgan` | Out for a walk              | Collecting ideas and everyday moments.                | +1 202-555-0104      |
| `priya`  | Sketching the next idea     | Small details, thoughtful design, and shared stories. | +1 202-555-0105      |
| `casey`  | Reading something good      | Books, long walks, and a little curiosity.            | +1 202-555-0106      |

Profiles start with light appearance and message sounds enabled. Photos initially use the app’s initials avatars. You can upload real test photos through Settings or group management. Email, phone, and location remain visible only to the account owner.

## 3. Friendships and requests

| People         | Seeded status   | What to try                                                 |
| -------------- | --------------- | ----------------------------------------------------------- |
| Jamie ↔ Alex   | Accepted        | Open direct chat; see Jamie’s pinned conversation           |
| Jamie ↔ Sam    | Accepted        | Direct messages and the audio sample                        |
| Jamie ↔ Priya  | Accepted        | Jamie’s archived and muted direct chat                      |
| Alex ↔ Sam     | Accepted        | A second direct conversation for Alex                       |
| Alex ↔ Priya   | Accepted        | Add/invite friends to groups                                |
| Sam ↔ Priya    | Accepted        | Design group management                                     |
| Sam ↔ Morgan   | Accepted        | Morgan’s group invitation                                   |
| Morgan → Jamie | Pending         | Jamie accepts/declines; Morgan cancels the outgoing request |
| Jamie → Casey  | Pending         | Casey accepts/declines; Jamie cancels the outgoing request  |
| Alex ↔ Casey   | Blocked by Alex | Alex checks Friends → Blocked and can unblock Casey         |

All other pairs have no friendship. Use Find people to send a new request.

## 4. Groups and roles

| Group            | Description                                                     | Owner | Admins | Other members |
| ---------------- | --------------------------------------------------------------- | ----- | ------ | ------------- |
| The weekend crew | Little adventures, good coffee, and plans worth making.         | Jamie | Alex   | Sam           |
| Design circle    | A space for thoughtful design, shared references, and feedback. | Sam   | Priya  | Alex          |
| The reading nook | Book recommendations and stories worth sharing.                 | Priya | None   | Jamie         |

Sam pins Design circle. Jamie mutes The reading nook.

Open a group conversation → **Conversation details → Manage group**:

- Owners can promote/demote admins and transfer ownership.
- Owners and admins can edit the name, description, and photo, add friends, send invitations, and remove ordinary members.
- Admins cannot remove the owner or other admins, or assign admin roles.
- Ordinary members can chat, see members and shared files, change their own pin/archive/mute settings, and leave.

## 5. Group invitations

| Group            | Inviter | Recipient | Initial state                             |
| ---------------- | ------- | --------- | ----------------------------------------- |
| The weekend crew | Jamie   | Priya     | Pending; expires seven days after seeding |
| Design circle    | Sam     | Morgan    | Pending; expires seven days after seeding |

Sign in as Priya or Morgan and open **Groups** to accept or decline. Group message history and shared files are unavailable before joining. Owners/admins can review and cancel invitations through **Manage group → Invitations**.

The seeder marks these invitations as seeded. Running it again does not bring back an invitation you accepted, declined, cancelled, or allowed to expire. Send a new invitation from the app if you want to try the flow again.

## 6. Conversations, read state, and attachments

| Direct conversation | Initial details                                                                   |
| ------------------- | --------------------------------------------------------------------------------- |
| Jamie ↔ Alex        | Seven coffee/weekend messages; pinned by Jamie; includes read and unread messages |
| Jamie ↔ Sam         | Trail message plus a playable audio sample                                        |
| Jamie ↔ Priya       | Two read messages; archived and muted for Jamie                                   |
| Alex ↔ Sam          | Two design-reference messages                                                     |

Each group has sample messages. The weekend group also has these files:

| File                       | Shared by | Where            | Contents                                                                                          |
| -------------------------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------- |
| `weekend-plan.txt`         | Jamie     | The weekend crew | A fictional coffee/walk/lunch schedule                                                            |
| `welcome-illustration.png` | Alex      | The weekend crew | The illustration preserved from the original repository                                           |
| `sample-tone.wav`          | Sam       | Jamie ↔ Sam      | A generated one-second, quiet 440 Hz tone for audio-player testing; not a person’s recorded voice |

Files are stored as binary data in MongoDB and served through the app’s authorized file endpoint. Browse them in **Conversation details → Shared files**, download the text file, open the image, or play the tone. The WAV file is a built-in fixture; normal voice recording still uses the browser-supported recording formats.

Message times are spread across the preceding 92 minutes. Read/unread counts change when accounts open chats. New messages can restore an archived conversation. Presence and typing are real runtime state: open two accounts in separate browsers to see them; the seeder does not fake online users.

## 7. Expected fresh-database counts

| Data                      | Count |
| ------------------------- | ----: |
| Users                     |     6 |
| Friendship records        |    10 |
| Direct conversations      |     4 |
| Groups                    |     3 |
| Messages                  |    23 |
| Attachments               |     3 |
| Pending group invitations |     2 |

The command prints **new records created during that run**, not total database counts. A second unchanged run prints zero for every category. It also stores internal seed markers in the `seedrecords` collection; these support safe reruns and are not application users or conversations.

## 8. Reruns and existing demo data

- Existing demo passwords, profiles, group names, membership, admin roles, message read states, and conversation flags are preserved.
- Normal accounts are never replaced. An email/username conflict with a non-demo account stops the seed before creating users.
- Existing friendships are kept. Once tracked, removing or declining a seeded relationship does not restore it on a rerun.
- Tracked deleted conversations, attachments, and messages remain deleted.
- Accepting/declining invitations is preserved; invitation expiries are not extended on reruns.
- Live conversation previews are not overwritten by older seed messages.
- Existing original four-user demo data is adopted using its original message IDs and direct-chat keys, then missing sample records are added. Its original weekend group roles and existing profile details remain unchanged; the tables above describe a fresh database.
- Run one seeder process at a time. A failed run may have created earlier records; fix the reported issue and rerun. The seed is additive, not a database reset.

If you need the exact pristine fixture state, use a fresh development database and point both the app and seeder to it. Keep existing databases and backups intact.

## 9. Seeder file structure

```text
scripts/
  seed.mjs                       # CLI: environment, connection, summary, errors
  seed/
    runSeed.mjs                   # Runs each seed step in dependency order
    seedUsers.mjs
    seedFriendships.mjs
    seedConversations.mjs
    seedAttachments.mjs
    seedMessages.mjs
    seedInvitations.mjs
    createAudioSample.mjs
    models/SeedRecord.mjs         # Stable seed markers
    data/                        # Separate user/friend/chat/message/invite fixtures
    assets/welcome.png
```

Change the fixture files to customize fresh sample data. Keep message keys and seed identifiers stable to prevent duplicates. Changed fixture values do not overwrite existing records; create a new fixture key or use the app to edit an existing record.

## 10. Troubleshooting

Run `npm run test:seed` with local MongoDB available to verify fixture counts, repeatable runs, edit preservation, account conflicts, and adoption of original demo data. These tests use uniquely named temporary databases and remove only those test databases afterward.

| Symptom                                 | Action                                                                                            |
| --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Password validation error               | Supply `DEMO_PASSWORD` with at least eight characters                                             |
| Cannot connect to MongoDB               | Start MongoDB; check `MONGODB_URI`; use the development Compose override for a local Node process |
| Demo account conflict                   | Resolve the non-demo username/email collision; the seeder will not overwrite it                   |
| Old password still works                | Intended behavior: reruns preserve passwords; use the app to change yours                         |
| Existing group has different roles/name | Intended behavior: your prior edits are preserved                                                 |
| No invitation after rerunning           | It may have been answered/cancelled/expired; send another through group management                |
| New seed data is not visible            | Refresh the page and verify the app and seeder use the same database                              |

Demo credentials are for local development. Do not run this seeder in a public production database. Email reset also requires SMTP configuration and is not enabled by seeding.
