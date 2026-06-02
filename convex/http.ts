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
    const payload = await request.text();

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

export default http;
