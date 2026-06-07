import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

function generateInviteCode(): string {
  // crypto.randomUUID() is CSPRNG-backed; far more entropy than Math.random()
  return crypto.randomUUID().replace(/-/g, '').substring(0, 10).toUpperCase();
}

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();
    if (!user) throw new Error('User not found');

    const serverId = await ctx.db.insert('servers', {
      name: args.name,
      description: args.description,
      imageUrl: args.imageUrl,
      inviteCode: generateInviteCode(),
      ownerId: user._id,
    });

    // Add owner as member
    await ctx.db.insert('members', {
      userId: user._id,
      serverId,
      role: 'owner',
    });

    // Create default channels
    await ctx.db.insert('channels', {
      name: 'general',
      type: 'text',
      serverId,
      category: 'TEXT CHANNELS',
    });
    await ctx.db.insert('channels', {
      name: 'General',
      type: 'voice',
      serverId,
      category: 'VOICE CHANNELS',
    });

    return serverId;
  },
});

export const getByUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();
    if (!user) return [];

    const memberships = await ctx.db
      .query('members')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();

    const servers = await Promise.all(
      memberships.map((m) => ctx.db.get(m.serverId))
    );
    return servers.filter(Boolean);
  },
});

export const getById = query({
  args: { serverId: v.id('servers') },
  handler: async (ctx, args) => {
    return ctx.db.get(args.serverId);
  },
});

export const getByInviteCode = query({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query('servers')
      .withIndex('by_invite_code', (q) => q.eq('inviteCode', args.inviteCode))
      .unique();
  },
});

export const join = mutation({
  args: { inviteCode: v.string(), clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();
    if (!user) throw new Error('User not found');

    const server = await ctx.db
      .query('servers')
      .withIndex('by_invite_code', (q) => q.eq('inviteCode', args.inviteCode))
      .unique();
    if (!server) throw new Error('Server not found');

    const existing = await ctx.db
      .query('members')
      .withIndex('by_user_and_server', (q) =>
        q.eq('userId', user._id).eq('serverId', server._id)
      )
      .unique();
    if (existing) return server._id;

    await ctx.db.insert('members', {
      userId: user._id,
      serverId: server._id,
      role: 'member',
    });

    return server._id;
  },
});

export const leave = mutation({
  args: { serverId: v.id('servers'), clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();
    if (!user) throw new Error('User not found');

    const member = await ctx.db
      .query('members')
      .withIndex('by_user_and_server', (q) =>
        q.eq('userId', user._id).eq('serverId', args.serverId)
      )
      .unique();
    if (member) await ctx.db.delete(member._id);
  },
});

const RESERVED_SERVER_NAMES = new Set([
  'discord', 'admin', 'administrator', 'staff', 'support', 'official', 'system', 'null', 'undefined',
]);

export const rename = mutation({
  args: { serverId: v.id('servers'), name: v.string(), clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();
    if (!user) throw new Error('User not found');

    const server = await ctx.db.get(args.serverId);
    if (!server) throw new Error('Server not found');
    if (server.ownerId !== user._id) throw new Error('Not authorized');

    const name = args.name.trim();
    if (name.length < 2 || name.length > 100) throw new Error('Server name must be 2–100 characters');
    if (RESERVED_SERVER_NAMES.has(name.toLowerCase())) throw new Error(`"${name}" is a reserved server name`);

    await ctx.db.patch(args.serverId, { name });
    return ctx.db.get(args.serverId);
  },
});

export const remove = mutation({
  args: { serverId: v.id('servers'), clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();
    if (!user) throw new Error('User not found');

    const server = await ctx.db.get(args.serverId);
    if (!server) throw new Error('Server not found');
    if (server.ownerId !== user._id) throw new Error('Only the owner can delete a server');

    // Fetch members and channels in parallel, then fan out message deletes concurrently
    const [members, channels] = await Promise.all([
      ctx.db.query('members').withIndex('by_server', (q) => q.eq('serverId', args.serverId)).collect(),
      ctx.db.query('channels').withIndex('by_server', (q) => q.eq('serverId', args.serverId)).collect(),
    ]);

    await Promise.all([
      Promise.all(members.map((m) => ctx.db.delete(m._id))),
      Promise.all(
        channels.map(async (ch) => {
          const messages = await ctx.db
            .query('messages')
            .withIndex('by_channel', (q) => q.eq('channelId', ch._id))
            .collect();
          await Promise.all(messages.map((msg) => ctx.db.delete(msg._id)));
          await ctx.db.delete(ch._id);
        })
      ),
    ]);

    await ctx.db.delete(args.serverId);
  },
});

export const getMembers = query({
  args: { serverId: v.id('servers') },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query('members')
      .withIndex('by_server', (q) => q.eq('serverId', args.serverId))
      .collect();

    return Promise.all(
      members.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return { ...m, user };
      })
    );
  },
});
