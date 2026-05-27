import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { api } from './_generated/api';

const http = httpRouter();

// Clerk webhook endpoint for user sync
http.route({
  path: '/clerk-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const payload = await request.text();
    let data: any;

    try {
      data = JSON.parse(payload);
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    const eventType = data.type;

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
