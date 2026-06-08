import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { api } from './_generated/api';
import { Webhook } from 'svix';

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET ?? '';

const http = httpRouter();

// Clerk webhook endpoint for user sync
http.route({
  path: '/clerk-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.startsWith('application/json')) {
      return new Response('Unsupported content type', { status: 415 });
    }

    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 1_048_576) {
      return new Response('Payload too large', { status: 413 });
    }

    const buffer = await request.arrayBuffer();
    if (buffer.byteLength > 1_048_576) {
      return new Response('Payload too large', { status: 413 });
    }
    const payload = new TextDecoder().decode(buffer);

    const svixId = request.headers.get('svix-id') ?? '';
    const svixTimestamp = request.headers.get('svix-timestamp') ?? '';
    const svixSignature = request.headers.get('svix-signature') ?? '';

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response('Missing svix headers', { status: 400 });
    }

    let data: any;
    try {
      const wh = new Webhook(WEBHOOK_SECRET);
      data = wh.verify(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
    } catch {
      return new Response('Invalid webhook signature', { status: 400 });
    }

    const eventType = (data as any).type;

    if (eventType === 'user.created' || eventType === 'user.updated') {
      const { id, first_name, last_name, username, email_addresses, image_url } = data.data;

      const name = [first_name, last_name].filter(Boolean).join(' ') || username || 'Unknown';
      const email = email_addresses?.[0]?.email_address || '';
      const uname = username || email.split('@')[0] || id;

      await ctx.runMutation(api.users.upsertFromClerk, {
        clerkId: id,
        name,
        username: uname,
        email,
        imageUrl: image_url,
      });
    }

    return new Response(null, { status: 200 });
  }),
});

// --- Discord Interactions Endpoint ---
// See: https://discord.com/developers/docs/interactions/receiving-and-responding
import nacl from 'tweetnacl';

const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY ?? '';

http.route({
  path: '/discord-interactions',
  method: 'POST',
  handler: httpAction(async (_ctx, request) => {
    // Discord signature verification
    const signature = request.headers.get('x-signature-ed25519');
    const timestamp = request.headers.get('x-signature-timestamp');
    if (!signature || !timestamp) {
      return new Response('Missing signature headers', { status: 401 });
    }
    const body = await request.arrayBuffer();
    const isVerified = nacl.sign.detached.verify(
      new TextEncoder().encode(timestamp + new TextDecoder().decode(body)),
      Buffer.from(signature, 'hex'),
      Buffer.from(DISCORD_PUBLIC_KEY, 'hex')
    );
    if (!isVerified) {
      return new Response('Invalid request signature', { status: 401 });
    }
    const json = JSON.parse(new TextDecoder().decode(body));
    // Ping
    if (json.type === 1) {
      return Response.json({ type: 1 });
    }
    // Slash command
    if (json.type === 2) {
      // Example: echo command
      if (json.data.name === 'echo') {
        return Response.json({
          type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
          data: { content: json.data.options?.[0]?.value || 'No input' },
        });
      }
      // Unknown command
      return Response.json({
        type: 4,
        data: { content: 'Unknown command.' },
      });
    }
    // Default: not handled
    return new Response('Unhandled interaction', { status: 400 });
  }),
});

export default http;
