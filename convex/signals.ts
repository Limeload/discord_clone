import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const send = mutation({
  args: {
    toUserId: v.id('users'),
    channelId: v.id('channels'),
    type: v.union(v.literal('offer'), v.literal('answer'), v.literal('ice-candidate')),
    payload: v.string(),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const fromUser = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();
    if (!fromUser) throw new Error('User not found');

    return ctx.db.insert('signals', {
      fromUserId: fromUser._id,
      toUserId: args.toUserId,
      channelId: args.channelId,
      type: args.type,
      payload: args.payload,
      processed: false,
    });
  },
});

export const receive = query({
  args: { channelId: v.id('channels'), clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();
    if (!user) return [];

    return ctx.db
      .query('signals')
      .withIndex('by_to_user_and_channel', (q) =>
        q.eq('toUserId', user._id).eq('channelId', args.channelId)
      )
      .filter((q) => q.eq(q.field('processed'), false))
      .collect();
  },
});

export const markProcessed = mutation({
  args: { signalId: v.id('signals') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.signalId, { processed: true });
  },
});

export const joinVoice = mutation({
  args: { channelId: v.id('channels'), clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();
    if (!user) throw new Error('User not found');

    const existing = await ctx.db
      .query('voiceParticipants')
      .withIndex('by_user_and_channel', (q) =>
        q.eq('userId', user._id).eq('channelId', args.channelId)
      )
      .unique();

    if (!existing) {
      await ctx.db.insert('voiceParticipants', {
        userId: user._id,
        channelId: args.channelId,
        muted: false,
        deafened: false,
        cameraOn: false,
        joinedAt: Date.now(),
      });
    }
    return user._id;
  },
});

export const leaveVoice = mutation({
  args: { channelId: v.id('channels'), clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();
    if (!user) return;

    const participant = await ctx.db
      .query('voiceParticipants')
      .withIndex('by_user_and_channel', (q) =>
        q.eq('userId', user._id).eq('channelId', args.channelId)
      )
      .unique();

    if (participant) await ctx.db.delete(participant._id);
  },
});

export const updateVoiceState = mutation({
  args: {
    channelId: v.id('channels'),
    clerkId: v.string(),
    muted: v.optional(v.boolean()),
    deafened: v.optional(v.boolean()),
    cameraOn: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();
    if (!user) return;

    const participant = await ctx.db
      .query('voiceParticipants')
      .withIndex('by_user_and_channel', (q) =>
        q.eq('userId', user._id).eq('channelId', args.channelId)
      )
      .unique();

    if (participant) {
      const updates: Record<string, boolean> = {};
      if (args.muted !== undefined) updates.muted = args.muted;
      if (args.deafened !== undefined) updates.deafened = args.deafened;
      if (args.cameraOn !== undefined) updates.cameraOn = args.cameraOn;
      await ctx.db.patch(participant._id, updates);
    }
  },
});

export const getVoiceParticipants = query({
  args: { channelId: v.id('channels') },
  handler: async (ctx, args) => {
    const participants = await ctx.db
      .query('voiceParticipants')
      .withIndex('by_channel', (q) => q.eq('channelId', args.channelId))
      .collect();

    return Promise.all(
      participants.map(async (p) => {
        const user = await ctx.db.get(p.userId);
        return { ...p, user };
      })
    );
  },
});
