# Discord Clone

A full-stack Discord clone built with React, Convex, and Clerk.

## Stack

- **Frontend** — React + TypeScript + Vite + Tailwind CSS
- **Backend** — Convex (real-time database, queries, mutations, file storage)
- **Auth** — Clerk (sign-in, sign-up, webhooks)
- **Voice/Video** — WebRTC with Convex as the signaling layer

## Features

- Real-time text chat with message edit/delete
- File and image attachments
- Typing indicators
- Voice and video channels (WebRTC P2P)
- Server and channel management
- Invite codes to join servers
- Online presence indicators

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Clerk

Create an app at [dashboard.clerk.com](https://dashboard.clerk.com) and copy your publishable key.

### 3. Set up Convex

```bash
npx convex dev
```

This creates a project at [dashboard.convex.dev](https://dashboard.convex.dev), generates backend types, and starts the dev server.

### 4. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your keys:

```env
VITE_CONVEX_URL=https://your-project.convex.cloud
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### 5. Start the frontend

```bash
npm run dev:frontend
```

Or run both backend and frontend together:

```bash
npm run dev
```

### 6. Wire up the Clerk webhook

In your Clerk dashboard → Webhooks, add an endpoint:

```
https://your-project.convex.site/clerk-webhook
```

Subscribe to `user.created` and `user.updated` events. This keeps user records in sync between Clerk and Convex.

## Discord Slash Commands via Convex

### 1. Set up Discord Application
- Go to the [Discord Developer Portal](https://discord.com/developers/applications) and create an application.
- Under "Bot" > "Privileged Gateway Intents", enable the required intents.
- Under "OAuth2" > "URL Generator", add the `applications.commands` and `bot` scopes.
- Under "General Information", copy your **Public Key**.

### 2. Configure Environment Variables
Add the following to your `.env.local`:

```
DISCORD_PUBLIC_KEY=your-discord-public-key-here
```

### 3. Register the Slash Command
Use Discord's API or a tool to register a command, e.g.:

```
curl -X POST "https://discord.com/api/v10/applications/<app_id>/commands" \
  -H "Authorization: Bot <bot_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "echo",
    "description": "Echo back your input",
    "options": [{
      "name": "text",
      "description": "Text to echo",
      "type": 3,
      "required": false
    }]
  }'
```

### 4. Add the Convex Endpoint to Discord
In the Discord Developer Portal, set your Interactions Endpoint URL to:

```
https://<your-convex-deployment>.convex.site/discord-interactions
```

### 5. Test the Command
Type `/echo hello` in your Discord server. The bot should reply with `hello`.

## Deployment

**Backend:**
```bash
npm run convex:deploy
```

**Frontend:** Connect your GitHub repo to [Vercel](https://vercel.com). Set `VITE_CONVEX_URL` and `VITE_CLERK_PUBLISHABLE_KEY` in the Vercel environment settings.
