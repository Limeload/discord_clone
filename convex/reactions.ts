import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const toggle = mutation({
  args: {
    messageId: v.id('messages'),
    emoji: v.string(),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();
    if (!user) throw new Error('User not found');

    const existing = await ctx.db
      .query('reactions')
      .withIndex('by_message_and_user', (q) =>
        q.eq('messageId', args.messageId).eq('userId', user._id)
      )
      .filter((q) => q.eq(q.field('emoji'), args.emoji))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    } else {
      await ctx.db.insert('reactions', {
        messageId: args.messageId,
        userId: user._id,
        emoji: args.emoji,
      });
    }
  },
});

export const getForChannel = query({
  args: { channelId: v.id('channels') },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_channel', (q) => q.eq('channelId', args.channelId))
      .collect();

    const allReactions: Record<string, { emoji: string; count: number; userIds: string[] }[]> = {};

    for (const msg of messages) {
      const reactions = await ctx.db
        .query('reactions')
        .withIndex('by_message', (q) => q.eq('messageId', msg._id))
        .collect();

      const grouped: Record<string, string[]> = {};
      for (const r of reactions) {
        if (!grouped[r.emoji]) grouped[r.emoji] = [];
        grouped[r.emoji].push(r.userId);
      }

      allReactions[msg._id] = Object.entries(grouped).map(([emoji, userIds]) => ({
        emoji,
        count: userIds.length,
        userIds,
      }));
    }

    return allReactions;
  },
});
