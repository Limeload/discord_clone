import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const getByServer = query({
  args: { serverId: v.id('servers') },
  handler: async (ctx, args) => {
    return ctx.db
      .query('channels')
      .withIndex('by_server', (q) => q.eq('serverId', args.serverId))
      .collect();
  },
});

export const getById = query({
  args: { channelId: v.id('channels') },
  handler: async (ctx, args) => {
    return ctx.db.get(args.channelId);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal('text'), v.literal('voice'), v.literal('video')),
    serverId: v.id('servers'),
    category: v.optional(v.string()),
    clerkId: v.string(),
  },
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
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      throw new Error('Not authorized');
    }

    return ctx.db.insert('channels', {
      name: args.name.toLowerCase().replace(/\s+/g, '-'),
      type: args.type,
      serverId: args.serverId,
      category: args.category,
    });
  },
});

export const remove = mutation({
  args: { channelId: v.id('channels'), clerkId: v.string() },
  handler: async (ctx, args) => {
    const channel = await ctx.db.get(args.channelId);
    if (!channel) throw new Error('Channel not found');

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();
    if (!user) throw new Error('User not found');

    const member = await ctx.db
      .query('members')
      .withIndex('by_user_and_server', (q) =>
        q.eq('userId', user._id).eq('serverId', channel.serverId)
      )
      .unique();
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      throw new Error('Not authorized');
    }

    await ctx.db.delete(args.channelId);
  },
});
