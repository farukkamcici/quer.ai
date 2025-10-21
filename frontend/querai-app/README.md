# Quer.ai Frontend (Next.js App Router)

Production-ready Next.js 15 App Router application for Quer.ai featuring a marketing landing page, dual-sidebar chat workspace, Supabase auth, and deep integration with the FastAPI backend for connection and chat orchestration.

## Tech Stack

- Next.js App Router (15.x) with React 19
- Tailwind CSS 4 + CSS custom properties for theming
- shadcn/ui (Radix primitives + custom wrappers) for UI components
- Supabase (`@supabase/ssr`) for server/client auth helpers
- Zustand stores for chat + connection state
- Sonner toast notifications & lucide-react icon set
- Framer Motion for hero/section entry animations
- AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/lib-storage`) + `uuid` for uploads
- zod + react-hook-form for type-safe forms and validation

## Features

- Marketing landing page at `/` with Hero/Features/Footer sections, Plus Jakarta Sans branding, and query-driven `AuthModal` overlay (`?auth=login|signup`).
- Authenticated workspace at `/home` (App route group) guarded server-side by Supabase; includes glassmorphism layout, theme toggle, and user menu.
- Dual sidebars
  - `ChatSidebar`: chat history with TTL badges, delete-all dialog, collapsed icon mode with persisted state.
  - `Sidebar`: data sources list, schema viewer accordion, add/edit dialogs, refresh action, collapsed state persisted in `localStorage`.
- Connection management modal with zod + RHF validation, S3 uploads for CSV/Excel, and FastAPI `/api/connections` integration for schema caching.
- Chat experience driven by Zustand stores: auto chat creation when a source is selected, localStorage-backed current chat id, meta/SQL response rendering with copyable SQL + results table.
- API proxies under `app/api/*` forward to FastAPI (`/api/query`, `/api/chat/*`, `/api/connections/*`) while handling Supabase fallback logic for chat creation/deletion.
- Theme + design system: CSS tokens in `globals.css`, `Surface` glass components, persisted `data-theme` via inline script + `ThemeToggle` component.

## Project Structure

```
querai-app/
├─ app/
│  ├─ (marketing)/page.jsx            # Public landing page
│  ├─ (app)/home/page.jsx             # Authenticated workspace shell
│  ├─ chat/[id]/page.jsx              # Deep link into a saved chat
│  ├─ actions/
│  │  ├─ auth.js                      # signOut server action
│  │  └─ connections.js               # add/update/delete/refresh connection actions
│  ├─ api/
│  │  ├─ query/route.js               # Proxy to FastAPI /api/query
│  │  └─ chat/
│  │     ├─ create/route.js           # Create chat (FastAPI first, Supabase fallback)
│  │     ├─ message/route.js          # Relay chat messages to backend
│  │     └─ delete-all/route.js       # Delete all chats via backend
│  ├─ layout.js                       # Root layout + Toaster + theme bootstrap script
│  ├─ login/page.jsx                  # Supabase login form
│  ├─ signup/page.jsx                 # Supabase signup form
│  └─ globals.css                     # Tokens + global styles
│
├─ components/
│  ├─ Hero.jsx / Features.jsx / Footer.jsx   # Marketing sections
│  ├─ LogoutButton.jsx
│  ├─ auth/
│  │  ├─ AuthModal.jsx
│  │  ├─ LoginForm.jsx
│  │  └─ SignupForm.jsx
│  ├─ brand/
│  │  ├─ Gradient.jsx
│  │  ├─ Motion.jsx
│  │  ├─ Surface.jsx
│  │  └─ ThemeToggle.jsx
│  ├─ chat/
│  │  ├─ AIMessage.jsx
│  │  ├─ AILoading.jsx
│  │  ├─ ChatInterface.jsx
│  │  ├─ ChatList.jsx
│  │  ├─ ChatPageClient.jsx
│  │  └─ NewChatButton.jsx
│  ├─ connections/
│  │  ├─ AddConnectionButton.jsx
│  │  ├─ ConnectionList.jsx
│  │  └─ SchemaViewer.jsx
│  ├─ layout/
│  │  ├─ ChatSidebar.jsx
│  │  └─ Sidebar.jsx
│  └─ ui/
│     ├─ accordion.jsx
│     ├─ avatar.jsx
│     ├─ button.jsx
│     ├─ card.jsx
│     ├─ dialog.jsx
│     ├─ dropdown-menu.jsx
│     ├─ form.jsx
│     ├─ input.jsx
│     ├─ label.jsx
│     ├─ radio-group.jsx
│     └─ select.jsx
│
├─ lib/
│  ├─ supabase/client.js              # Browser client (createBrowserClient)
│  ├─ supabase/server.js              # Server client (cookies + SSR)
│  ├─ stores/chatStore.js             # Zustand store: chat state + persistence
│  ├─ stores/connectionStore.js       # Zustand store: selected connection
│  ├─ s3/upload.js                    # S3 upload helper for server actions
│  └─ utils.js                        # cn() helper
│
├─ public/                            # Static assets
├─ README.md                          # This file
└─ package.json
```

## Pages & Routing

- `/` (marketing): public route built with Hero/Features/Footer components, Plus Jakarta Sans font, and Suspense-wrapped `AuthModal` triggered via `?auth=login|signup`.
- `/login` & `/signup`: client components using shadcn Card/Input/Label/Button; authenticate with Supabase and redirect to `/home` on success.
- `/home`: server component in the `(app)` route group that enforces Supabase auth, renders dual glass sidebars, theme toggle, and `ChatInterface`.
- `/chat/[id]`: server component that loads a specific chat + connections, then hydrates `ChatPageClient` for scoped chatting.
- API routes under `app/api/`
  - `POST /api/query` → forwards to `${PYTHON_BACKEND_URL}/api/query` with `{ question, connection_id }`.
  - `POST /api/chat/create` → tries FastAPI first, falls back to Supabase insert, optionally binds `data_source_id`.
  - `POST /api/chat/message` → proxies to `${PYTHON_BACKEND_URL}/api/chat/message`.
  - `POST /api/chat/delete-all` → deletes chats via `${PYTHON_BACKEND_URL}/api/chat/delete_all`.

## Data Flow & Workflows

- Authentication
  - Root layout + route handlers use `lib/supabase/server.js`; unauthenticated requests to `/home` redirect to `/login`.
  - Marketing page keeps `AuthModal` in Suspense so query-string changes instantly open login/signup.
  - User dropdown relies on a server action (`app/actions/auth.js`) to sign out without exposing service keys.

- Connections CRUD
  - `AddConnectionButton` uses zod + react-hook-form; FormData is posted to server actions that invoke FastAPI `/api/connections`.
  - CSV/Excel uploads stream to S3 via `lib/s3/upload.js` prior to backend schema discovery.
  - Schema metadata (`schema_json`, `is_large`) returned by the backend is rendered inside `SchemaViewer` with expand/collapse helpers.
  - Collapsed state for the data source sidebar persists in `localStorage` and hydrates on mount; refresh action calls `/api/connections/{id}/refresh`.

- Chat
  - `ChatSidebar` fetches chats via Supabase client, displays TTL status, and persists collapsed state.
  - `useChatStore` keeps `currentChatId` + messages; selecting a connection auto-creates a chat through `/api/chat/create` and stores the id in `localStorage`.
  - `ChatInterface` normalises historical messages, handles Gemini `response_type` (`sql` vs `meta`), auto-titles chats, and scrolls to the latest message.
  - Message sends call `/api/chat/message`, append user + assistant responses to Supabase, and show Sonner feedback on failures.
  - Delete-all chats trigger the backend endpoint, reset local stores, clear `localStorage`, and broadcast `chat:refresh-list` for any listeners.

## UI System

- shadcn-style wrappers (Radix under the hood) deliver consistent focus rings, disabled styles, and density across forms/dialogs/menus.
- Tokens + themes: `globals.css` defines `--qr-*` variables for surfaces, borders, text, and shadows; `ThemeToggle` updates `data-theme` with pre-hydration inline script.
- Glass surfaces: `Surface` component encapsulates glassmorphism treatments for sidebars, header, and marketing cards.
- Dual sidebars: both `Sidebar` and `ChatSidebar` support icon-only collapsed modes with edge toggles and persisted state.
- Schema viewer: accordion tree renders Supabase-provided `schema_json`, includes expand/collapse all, and shows column types as badges.
- AI message cards: `AIMessage` displays explanation, copyable SQL, and tabular results; `AILoading` provides animated thinking states.

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

- Server actions resolve to `{ success, error? }`; callers surface Sonner toasts and `router.refresh()` when needed.
- Sidebar collapsed state and `currentChatId` persist in `localStorage`; helpers guard against SSR hydration mismatches.
- Custom DOM events (`chat:refresh-list`) notify components to re-fetch chats after mutations.
- Layout stays `h-screen`; only chat history and sidebar content scroll to maintain glassmorphism backdrop.
- Always use shadcn wrappers + zod forms for inputs, setting accessible labels/aria attributes consistent with design tokens.

## Troubleshooting

- Dropdowns not opening: ensure our dropdown wrapper renders `children` and that the Portal isn’t clipped; header/sidebar use `z-20+`.
- Messages hidden under header: adjust `ChatInterface` top padding + `scroll-pt` to match header height.
- Connection creation failing: confirm `PYTHON_BACKEND_URL` is reachable and AWS/S3 env vars are populated for file sources.
- Backend not configured: `/api/query`, `/api/chat/message`, and `/api/chat/delete-all` require `PYTHON_BACKEND_URL`.
- Chat not created: if the backend returns an error we fall back to Supabase insert—check `chats` table RLS and that `data_source_id` is valid.
- Theme mismatch flash: ensure the inline script in `app/layout.js` runs before hydration (no CSP blocking inline script).

## Roadmap (nice‑to‑have)

- Streaming responses (SSE) for incremental AI answers.
- Result visualizations (charts) layered on top of SQL responses.
- Saved prompts / templates scoped per connection.
- Connection health monitor + automated schema diff notifications.
