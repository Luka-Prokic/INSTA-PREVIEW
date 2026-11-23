# Profile import

GRID is a **public** browser grid builder. Anyone can enter a public Instagram `@username` to load a preview and plan posts/Reels on top. An access token is **optional** (fuller import for the token owner’s own Business/Creator account only).

Every field in a `ProfileSnapshot` carries a status:

- `ok` – returned by an adapter
- `manual` – entered in **Edit profile**
- `unavailable` – no adapter could provide it

Adapters run in order and merge per field: **Graph API (if token) → Public page → Manual**.

## What each adapter can provide

| Field | Instagram Login API (own account + token) | Public page (username only) | Manual |
| --- | --- | --- | --- |
| Username | yes | yes | – |
| Display name | yes (`name`) | yes | yes |
| Profile picture | yes (`profile_picture_url`) | yes (when embedded) | yes |
| Bio | yes (`biography`) | yes | yes |
| Website / external link | yes (`website`) | yes | yes |
| Posts / Followers / Following | yes | yes | yes |
| Verified badge | **no** | yes | yes |
| Category label | **no** | sometimes | yes |
| Story highlights | **no** | **no** | yes |
| Published media (order) | yes (`/me/media`, up to ~300) | first page only | yes |
| Reel covers | yes (`thumbnail_url`) | yes | yes |
| Pinned posts | **no** | sometimes | yes |

## Default path: public @username

1. Open **Connect profile**.
2. Enter a **public** `@username`.
3. Click **Load profile** (no token).

The server warms a short Instagram session (cookies), then fetches `instagram.com/{username}` and parses embedded profile/media JSON. This is **best-effort**:

- Private accounts will not load.
- Cold requests often get an empty soft-404 shell; with cookies most public profiles return og/meta + JSON. Instagram can still throttle or block the server IP — you’ll see an error; retry, use **Edit profile**, or start a blank grid.
- Graph cannot fetch arbitrary other people’s profiles; only the public adapter can try that.

## Optional: access token (your own account)

Meta’s Graph API returns **only the token owner** (`/me`). Use a token when you want a richer media list for **your** Business/Creator account. End users of GRID do **not** need this for browsing public grids.

1. On desktop, open [developers.facebook.com](https://developers.facebook.com/) → **Login**.
2. My Apps → Create App → add **Instagram** → **Generate token** for your account. Official steps: [Get started](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/get-started).
3. In GRID, open Connect → **Advanced** → paste the token with your `@username` → **Load profile**.

Do **not** use Meta Business Suite → Business assets → Apps for this — that is a different product surface.

Refresh a long-lived token before expiry (any time after 24 h):

```bash
curl "https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=IGAAxxxxxxxx"
```

Optional local override for development only: `INSTAGRAM_TOKENS=username:token` in `.env.local`. Published deployments should not rely on shared env tokens for multi-user hosting.

## Security notes for hosting

- Serve over HTTPS.
- Never log request bodies that include tokens.
- Tokens are not written to cookies, files, or a database by this app (browser IndexedDB only, when the visitor pastes one).
- Users can **Clear** to wipe credentials and planned content from the browser.
