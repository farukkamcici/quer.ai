# Quer.ai Frontend (Next.js App Router)

Production‑ready Next.js 15 App Router application for Quer.ai with protected auth, glassmorphism UI, connection management, and a sticky chat interface powered by Supabase and a Python backend.

## Tech Stack

- Next.js App Router (15.x), React 19
- Tailwind CSS 4 for utility styling
- shadcn/ui (Radix primitives + custom wrappers) for UI components
- Supabase (auth + client/server helpers)
- Zustand for lightweight global state
- Sonner for toast notifications
- lucide-react icon set

## Features

- Protected routes with server-side auth check (redirects unauthenticated users to `/login`).
- Login/Sign Up pages using Supabase (`signInWithPassword`, `signUp`).
- User profile dropdown with secure server action logout.
- Data Connections sidebar:
  - Add/Edit using shadcn Form + react-hook-form + zod validation.
  - Delete with a shadcn Dialog confirmation.
  - Collapsible layout, icon-only mode when collapsed.
  - Selected item toggle and green active border.
- Sticky, fixed layout: browser doesn’t scroll; only chat and sidebar list scroll internally.
- Chat interface:
  - Sticky input bar; message history auto-scrolls to newest message.
  - AI message cards are full-width with internal max-height + scroll.
  - “Details” accordion for explanation + SQL (Copy button), data table below.
  - Playful rotating loading states while waiting for backend.
- API proxy route (`/api/query`) forwards to Python backend (keeps backend URL private, avoids CORS).
- Glassmorphism design for the header and sidebar (blue‑white tint, blur, rounded, depth).

## Project Structure

```
querai-app/
├─ app/
│  ├─ api/
│  │  └─ query/route.js           # Proxy to Python backend
│  ├─ actions/
│  │  ├─ auth.js                  # signOut server action
│  │  └─ connections.js           # add/update/delete connection actions
│  ├─ login/page.jsx              # Login UI + Supabase
│  ├─ signup/page.jsx             # Sign up UI + Supabase
│  ├─ layout.js                   # Root layout with Toaster
│  └─ page.js                     # Protected home, layout + ChatInterface
│
├─ components/
│  ├─ auth/
│  │  └─ UserProfile.jsx          # Avatar dropdown + logout form
│  ├─ chat/
│  │  ├─ AIMessage.jsx            # AI response card (accordion, SQL, table)
│  │  ├─ AILoading.jsx            # Animated “thinking” placeholder
│  │  └─ ChatInterface.jsx        # Sticky input, scrollable history
│  ├─ connections/
│  │  ├─ AddConnectionButton.jsx  # Form dialog (zod + RHF)
│  │  └─ ConnectionList.jsx       # List + edit/delete + collapsed mode
│  ├─ layout/
│  │  └─ Sidebar.jsx              # Glass sidebar (header/content/footer)
│  └─ ui/                         # shadcn-style wrappers
│     ├─ avatar.jsx
│     ├─ button.jsx
│     ├─ card.jsx
│     ├─ dialog.jsx
│     ├─ form.jsx
│     ├─ input.jsx
│     ├─ label.jsx
│     └─ select.jsx
│
├─ lib/
│  ├─ supabase/client.js          # Browser client (createBrowserClient)
│  ├─ supabase/server.js          # Server client (cookies + SSR)
│  ├─ stores/connectionStore.js   # Zustand store: selectedConnection
│  ├─ stores/chatStore.js         # Zustand store: chat state
│  ├─ s3/upload.js                # S3 upload helper (server action)
│  └─ utils.js                    # cn() helper
│
├─ public/                        # Static assets
├─ README.md                      # This file
└─ package.json
```

## Pages & Routing

- `/login` and `/signup`: client components with shadcn Card/Input/Label/Button. Use Supabase auth, show errors inline; redirect to `/` on success.
- `/` (home): server component. Checks `supabase.auth.getUser()` and redirects to `/login` if unauthenticated. Renders:
  - Sticky glass header with app title (left) and user avatar menu (right).
  - Glass sidebar (left) with collapsible layout and connection list.
  - ChatInterface (right) filling remaining space.
- `/api/query` (POST): Proxies to Python backend at `PYTHON_BACKEND_URL/api/query`.
- `/api/chat/create` (POST): Tries Python backend first; falls back to direct Supabase insert.
- `/api/chat/message` (POST): Proxies to Python backend `/api/chat/message`.

## Data Flow & Workflows

- Authentication
  - Client pages call `supabase.auth.*` using `lib/supabase_client.js`.
  - Server pages/actions use `lib/supabase/server.js` to read cookies.
  - Logout uses a server action and a form post (no client secrets).

- Connections CRUD
  - addConnection / updateConnection / deleteConnection are server actions returning `{ success, error? }`.
  - Client components show toasts via Sonner and call `router.refresh()` on success.
  - Add/Edit uses react-hook-form + zod; DB credentials are stringified as `db_details`.

- Chat
  - User selects a connection (Zustand `selectedConnection`) and submits a question.
  - Client POSTs to `/api/query` with `{ question, connection_id }` (or full connection if preferred).
  - While waiting: show `<AILoading />` with rotating witty states.
  - On response: render `<AIMessage />` with:
    - Accordion (“Details”) for explanation + SQL (Copy icon)
    - Data table (simple HTML table) if rows are present
  - Messages area auto-scrolls to the bottom on updates.

## UI System

- shadcn-style wrappers (Radix under the hood) for Button, Dialog, Form, Select, Avatar, etc.
- Tailwind 4 for utilities; glassmorphism (blur, alpha, ring, gradient) for header + sidebar.
- Collapsed sidebar:
  - Icon-only tiles (square) for connections.
  - Edge-centered glass pill toggle handle.
  - Footer hosts the “Add Connection” trigger (icon in collapsed mode).

## Setup & Environment

Env vars in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `PYTHON_BACKEND_URL` (e.g., `http://localhost:8000`)
- `AWS_REGION` (for S3 uploads)
- `AWS_ACCESS_KEY_ID` (for S3 uploads)
- `AWS_SECRET_ACCESS_KEY` (for S3 uploads)
- `S3_BUCKET_NAME` (target bucket for uploads)

Example `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...
PYTHON_BACKEND_URL=http://localhost:8000

# Optional: enable CSV/Excel uploads to S3 from server actions
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=your-bucket-name
```

## Scripts

- `npm run dev` – start dev server (Turbopack)
- `npm run build` – production build
- `npm run start` – start production server
- `npm run lint` – run ESLint

Start dev:
```
npm ci
npm run dev
```

## Conventions

- Server actions return `{ success, error? }`; UI components show toasts and call `router.refresh()`.
- Avoid browser scrolling; page is fixed height (`h-screen`). Only chat history and the connection list scroll.
- Prefer shadcn wrappers for consistency; Radix primitives sit underneath.
- Keep forms typed with zod + RHF; keep UI accessible (labels, `aria-pressed` on toggle buttons, etc.).

## Troubleshooting

- Dropdowns not opening: ensure our dropdown wrapper renders `children` and that the Portal isn’t clipped; header/sidebar use `z-20+`.
- Messages hidden under header: adjust ChatInterface top padding + `scroll-pt` to match header height.
- Backend not configured: ensure `PYTHON_BACKEND_URL` is set; `/api/query` and `/api/chat/message` depend on it.
- Chat not created: if backend create fails, route falls back to Supabase insert; verify `chats` table and RLS.
- CORS/backend issues: verify `PYTHON_BACKEND_URL` and backend is reachable.

## Roadmap (nice‑to‑have)

- Streaming responses (SSE) for incremental AI answers.
- Persist sidebar collapsed state and last selected connection.
- Theming token pass for the glass palette.
