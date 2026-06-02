import { mutation, query } from './_generated/server';
import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';

export const list = query({
  args: {
    channelId: v.id('channels'),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query('messages')
      .withIndex('by_channel', (q) => q.eq('channelId', args.channelId))
      .order('desc')
      .paginate(args.paginationOpts);

    const page = await Promise.all(
      result.page.map(async (msg) => {
        const author = await ctx.db.get(msg.authorId);
        return { ...msg, author };
      })
    );
    return { ...result, page: page.reverse() };
  },
});

export const send = mutation({
  args: {
    content: v.string(),
    channelId: v.id('channels'),
    clerkId: v.string(),
    fileUrl: v.optional(v.string()),
    fileType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();
    if (!user) throw new Error('User not found');

    // Clear typing indicator on send
    const typing = await ctx.db
      .query('typingIndicators')
      .withIndex('by_user_and_channel', (q) =>
        q.eq('userId', user._id).eq('channelId', args.channelId)
      )
      .unique();
    if (typing) await ctx.db.delete(typing._id);

    return ctx.db.insert('messages', {
      content: args.content,
      authorId: user._id,
      channelId: args.channelId,
      fileUrl: args.fileUrl,
      fileType: args.fileType,
    });
  },
});

export const edit = mutation({
  args: {
    messageId: v.id('messages'),
    content: v.string(),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();
    if (!user) throw new Error('User not found');

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error('Message not found');
    if (message.authorId !== user._id) throw new Error('Not authorized');

    await ctx.db.patch(args.messageId, {
      content: args.content,
      editedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { messageId: v.id('messages'), clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();
    if (!user) throw new Error('User not found');

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error('Message not found');

    // Allow author or admin/owner to delete
    if (message.authorId !== user._id) {
      const channel = await ctx.db.get(message.channelId);
      if (!channel) throw new Error('Channel not found');
      const member = await ctx.db
        .query('members')
        .withIndex('by_user_and_server', (q) =>
          q.eq('userId', user._id).eq('serverId', channel.serverId)
        )
        .unique();
      if (!member || member.role === 'member') throw new Error('Not authorized');
    }

    await ctx.db.patch(args.messageId, { deleted: true, content: 'This message was deleted.' });
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return ctx.storage.generateUploadUrl();
  },
});

export const getFileUrl = mutation({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return ctx.storage.getUrl(args.storageId);
  },
});

export const setTyping = mutation({
  args: { channelId: v.id('channels'), clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();
    if (!user) return;

    const existing = await ctx.db
      .query('typingIndicators')
      .withIndex('by_user_and_channel', (q) =>
        q.eq('userId', user._id).eq('channelId', args.channelId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { updatedAt: Date.now() });
    } else {
      await ctx.db.insert('typingIndicators', {
        userId: user._id,
        channelId: args.channelId,
        updatedAt: Date.now(),
      });
    }
  },
});

export const getTyping = query({
  args: { channelId: v.id('channels'), currentClerkId: v.string() },
  handler: async (ctx, args) => {
    const currentUser = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.currentClerkId))
      .unique();

    const cutoff = Date.now() - 5000; // 5 second window
    const indicators = await ctx.db
      .query('typingIndicators')
      .withIndex('by_channel', (q) => q.eq('channelId', args.channelId))
      .collect();

    const active = indicators.filter(
      (i) => i.updatedAt > cutoff && i.userId !== currentUser?._id
    );

    return Promise.all(
      active.map(async (i) => {
        const user = await ctx.db.get(i.userId);
        return user;
      })
    );
  },
});
