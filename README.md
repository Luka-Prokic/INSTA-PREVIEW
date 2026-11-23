# INSTA PREVIEW (GRID)

Browser Instagram grid builder: enter any public `@username` to preview Mobile and Desktop layouts, then plan unpublished posts/Reels locally. An Instagram access token is optional (richer import for your own Business/Creator account).

## Setup

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) (or the port shown in the terminal).

1. Click **Connect profile**
2. Enter a public `@username` and **Load profile** — or use **Plan without API** / **Edit profile** for manual fields
3. Optionally paste an access token under **Advanced** for a fuller own-account Graph import ([docs/IMPORT.md](docs/IMPORT.md))
4. Add planned posts/Reels in the sidebar — Mobile and Desktop previews update locally

## Stack

- Next.js 15 + TypeScript + React 19
- App chrome: vendored CAKA-CMS `@caka/admin`
- Instagram preview: separate CSS (not admin tokens)
- Public profile fetch (username) + optional Instagram Login API (token in the browser)
- IndexedDB for credentials, planned content, and cached media

## Publish

Deploy as a normal Next app. Do not put shared Instagram tokens in server env for multi-user hosting — public username import needs no token; optional visitor tokens never persist on the server.
