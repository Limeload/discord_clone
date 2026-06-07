import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const upsertFromClerk = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    username: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Normal update path: existing record for this Clerk identity
    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        username: args.username,
        email: args.email,
        imageUrl: args.imageUrl,
      });
      return existing._id;
    }

    // Email conflict: stale record with a different clerkId.
    // Clerk guarantees email uniqueness, so the same email means the same
    // person with a re-created account — merge by updating the clerkId.
    const emailConflict = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .unique();

    if (emailConflict) {
      await ctx.db.patch(emailConflict._id, {
        clerkId: args.clerkId,
        name: args.name,
        username: args.username,
        imageUrl: args.imageUrl,
      });
      return emailConflict._id;
    }

    // Username conflict: find a free username by appending a numeric suffix.
    let username = args.username;
    const usernameConflict = await ctx.db
      .query('users')
      .withIndex('by_username', (q) => q.eq('username', username))
      .unique();

    if (usernameConflict) {
      let suffix = 2;
      while (suffix <= 9999) {
        const candidate = `${args.username}-${suffix}`;
        const taken = await ctx.db
          .query('users')
          .withIndex('by_username', (q) => q.eq('username', candidate))
          .unique();
        if (!taken) { username = candidate; break; }
        suffix++;
      }
      if (username === args.username) throw new Error('Unable to assign a unique username');
    }

    return ctx.db.insert('users', {
      clerkId: args.clerkId,
      name: args.name,
      username,
      email: args.email,
      imageUrl: args.imageUrl,
      isOnline: false,
    });
  },
});

export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();
  },
});

export const getById = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return ctx.db.get(args.userId);
  },
});

export const setOnlineStatus = mutation({
  args: { clerkId: v.string(), isOnline: v.boolean() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();
    if (user) {
      await ctx.db.patch(user._id, { isOnline: args.isOnline });
    }
  },
});
