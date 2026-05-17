# ai-chatbot-youtube

A Next.js app with two AI chat features built on the same RAG (retrieval-augmented generation) pipeline:

- **`/chat`** — upload a PDF, then chat with its contents.
- **`/youtube-bot`** — paste a YouTube URL, then chat with the video's transcript.

Both features stream responses from OpenAI, retrieve relevant context with pgvector similarity search, and persist message history per user.

---

## Stack

| Layer            | Choice                                                          |
| ---------------- | --------------------------------------------------------------- |
| Framework        | Next.js 16 (App Router, `output: "standalone"`)                 |
| UI               | React 19, Tailwind CSS v4, shadcn-style primitives, AI Elements |
| Auth             | Clerk (`@clerk/nextjs`)                                         |
| LLM / Embeddings | OpenAI via Vercel AI SDK v6 (`ai`, `@ai-sdk/openai`)            |
| Database         | Neon Postgres + `pgvector` (HNSW indexes)                       |
| ORM / migrations | Drizzle ORM + `drizzle-kit`                                     |
| PDF parsing      | `pdf-parse-new` (server-only)                                   |
| Transcripts      | `youtube-transcript`                                            |
| Chunking         | `@langchain/textsplitters` (RecursiveCharacterTextSplitter)     |

> **Heads up:** this project uses Next.js 16+, which renames `middleware.ts` to **`proxy.ts`**. Don't create a `middleware.ts` — Clerk's middleware lives in `proxy.ts`.

---

## Getting started

### 1. Install

```bash
npm install
```

### 2. Configure environment

Create `.env.local` at the repo root:

```bash
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEON_DB_URL=postgres://...
```

All four are required. `NEON_DB_URL` is loaded by `lib/db/config.ts` via `dotenv` and is also needed at **build time** (see [Docker](#docker) below).

Your Neon database must have the `pgvector` extension enabled:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3. Run migrations

```bash
npx drizzle-kit migrate
```

This applies the SQL files in `migrations/` to the database at `NEON_DB_URL`. To author a new migration after editing `lib/db/schema.ts`:

```bash
npx drizzle-kit generate
```

### 4. Start the dev server

```bash
npm run dev
```

Open <http://localhost:3000>.

---

## Scripts

| Command                   | What it does                                                    |
| ------------------------- | --------------------------------------------------------------- |
| `npm run dev`             | Next.js dev server on port 3000                                 |
| `npm run build`           | Production build (`output: "standalone"`, used by Docker)       |
| `npm run start`           | Run the built app                                               |
| `npm run lint`            | ESLint flat config (extends `next/core-web-vitals` + TS preset) |
| `npx drizzle-kit generate`| Generate a new SQL migration from `lib/db/schema.ts`            |
| `npx drizzle-kit migrate` | Apply pending migrations to `NEON_DB_URL`                       |

Path alias: `@/*` resolves to the repo root (`tsconfig.json`).

---

## Architecture

### Two features, one pipeline

The PDF chat and YouTube bot share the same five-step pattern. Once you understand one, the other follows.

```
ingest → chunk → embed → store → retrieve (during chat)
```

1. **Ingest** the source (PDF upload or YouTube URL).
2. **Chunk** the text with `RecursiveCharacterTextSplitter` (size 150, overlap 20) — see `lib/ai/chunking.ts`.
3. **Embed** each chunk with OpenAI `text-embedding-3-small` (1536-dim) — see `lib/ai/embeddings.ts`.
4. **Store** chunks + vectors in Postgres with an HNSW index on cosine distance.
5. **Retrieve** the top-k relevant chunks at chat time via a tool call, and stream the answer.

### `/chat` (PDF Q&A)

- Upload handler: `app/chat/actions.ts` → ingests a PDF, parses it, chunks, embeds, and inserts into `pdf_documents` + `pdf_chunks`.
- Chat API: `app/api/chat/route.ts` streams a response using `streamText` with the `searchKnowledgeBase` tool (`lib/pdf-chat/tools.ts`). Retrieval is scoped to the chat's `documentId`.
- Each `chats` row references one `pdf_documents` row, so each chat is bound to a single document.

### `/youtube-bot` (per-video transcript Q&A)

- URL handler: `app/youtube-bot/actions.ts` → `lib/youtube/videos.ts::loadOrCreateVideo`. Extracts the video ID, fetches the transcript, chunks, embeds, stores in `youtube_videos` + `youtube_chunks`. Re-submitting the same URL hits the cache.
- Chat API: `app/api/youtube-bot/route.ts` streams using `makeYoutubeTools(videoId)` — a tool factory that closes over the video ID so the LLM's search is scoped to that one video.

### Shared streaming pattern

Every API route follows the same shape:

1. Verify Clerk `auth()`.
2. Check ownership of the chat (`getChatOwnership` / `getYoutubeChatOwnership`).
3. Persist the incoming user message.
4. Call `streamText({ model, messages, tools, system, stopWhen: stepCountIs(2) })`.
5. Return `result.toUIMessageStreamResponse({ originalMessages, onFinish })`.
6. `onFinish` persists the assistant response.

`stepCountIs(2)` caps the tool-call loop to one tool call followed by one final answer. For the first user message in a new PDF chat, the API also fires `lib/ai/generate-title.ts` to title the chat.

### Routing & layouts

- `app/layout.tsx` wraps the tree in `<ClerkProvider>` and the top `<Navigation />`.
- `app/chat/layout.tsx` and `app/youtube-bot/layout.tsx` wrap their feature in a `SidebarProvider` with a server-component sidebar that fetches the chat list and hands it to the client sidebar.
- `app/chat/page.tsx` / `app/youtube-bot/page.tsx` are the "new chat" entry points. The client (`components/chat-view.tsx`) optimistically uses a fresh UUID, and on first response calls `window.history.replaceState` + `router.refresh()` to swap the URL to `/chat/[chatId]` without losing the streamed state.

### Auth: Clerk via `proxy.ts`

`/`, `/sign-in*`, and `/sign-up*` are public. Everything else requires auth. Every server query that touches user data either calls `requireUserId()` (throws on no auth) or explicitly filters by `userId` from `auth()`. Files under `lib/` that must never run on the client start with `import "server-only"`.

---

## Data model

See `lib/db/schema.ts`. Summary:

| Table              | Purpose                                                              |
| ------------------ | -------------------------------------------------------------------- |
| `pdf_documents`    | Uploaded PDFs (per-user). Stores `full_text`, `token_count`, summary |
| `pdf_chunks`       | PDF chunks + `embedding vector(1536)`, HNSW cosine index             |
| `chats`            | PDF chat sessions, each bound to one `pdf_documents` row             |
| `messages`         | PDF chat messages. `parts` is JSONB of `UIMessagePart<…, ChatTools>` |
| `youtube_videos`   | Cached YouTube videos (per-user) with title/author/thumbnail/duration |
| `youtube_chunks`   | Transcript chunks + embeddings, HNSW cosine index                    |
| `youtube_chats`    | YouTube chat sessions, each bound to one `youtube_videos` row        |
| `youtube_messages` | YouTube chat messages. `parts` typed against `YoutubeTools`          |

> **AI SDK v6 storage format:** `messages.parts` and `youtube_messages.parts` are typed `UIMessagePart<UIDataTypes, …Tools>[]` — never store plain text into these columns. The types flow end-to-end via `InferUITools` so the client `useChat`, the API route, and the DB row all agree.

---

## AI SDK v6 conventions

- **Defining tools** — use `tool({ description, inputSchema: z.object({...}), execute })` from `ai`. Pass a `{ toolName: tool(...) }` record to `streamText`'s `tools` option.
- **Typed messages** — `ChatMessage` / `YoutubeMessage` are derived from each tool record via `InferUITools`, giving statically typed message parts everywhere.
- **Client** — `components/chat-view.tsx` uses `useChat` from `@ai-sdk/react` with a `DefaultChatTransport` pointed at the API route. `body: { chatId }` tells the server which chat to persist into.

---

## UI components

- `components/ai-elements/` — pre-built AI primitives (conversation, message, prompt-input, reasoning, tool calls, etc.). Prefer composing from these.
- `components/ui/` — shadcn primitives (button, dialog, sidebar, …).

---

## Docker

The Dockerfile is a three-stage build (deps → builder → runner) that produces a slim Node 22 Alpine image using the standalone Next.js output.

`NEON_DB_URL` is required as a **build arg** because `lib/db/config.ts` instantiates the Neon client at module load — which runs during Next.js's "collect page data" pass. It is *not* baked into the runtime image; only into the build stage.

```bash
docker build \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_... \
  --build-arg NEON_DB_URL=postgres://... \
  -t ai-chatbot-youtube .

docker run --rm -p 3000:3000 \
  -e OPENAI_API_KEY=sk-... \
  -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_... \
  -e CLERK_SECRET_KEY=sk_... \
  -e NEON_DB_URL=postgres://... \
  ai-chatbot-youtube
```

---

## Project layout

```
app/
  api/
    chat/route.ts            # PDF chat streaming endpoint
    youtube-bot/route.ts     # YouTube chat streaming endpoint
  chat/                      # PDF chat feature (upload + chat UI)
  youtube-bot/               # YouTube bot feature (URL submit + chat UI)
  layout.tsx                 # Root layout (ClerkProvider + Navigation)
components/
  ai-elements/               # AI SDK UI primitives
  ui/                        # shadcn primitives
  chat-view.tsx              # Shared chat client (useChat)
lib/
  ai/                        # chunking, embeddings, title + summary generation
  db/                        # Drizzle schema + Neon client config
  pdf-chat/                  # PDF chats, documents, search, tools
  youtube/                   # YouTube chats, videos, transcript, search, tools
migrations/                  # Drizzle-generated SQL migrations
proxy.ts                     # Clerk middleware (Next.js 16+ naming)
```

---

## Notes & gotchas

- **`pdf-parse-new` is server-only.** It's declared in `next.config.ts` under `serverExternalPackages`. Don't import it into a client component.
- **`NEON_DB_URL` is needed at build time**, not just at runtime. The Dockerfile threads it through `ARG` in the builder stage.
- **Don't create `middleware.ts`.** Next.js 16+ renamed it to `proxy.ts`.
- **HNSW indexes require `pgvector`.** Make sure the extension is enabled in your Neon database before running migrations.
