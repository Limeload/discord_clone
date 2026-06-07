import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    username: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
    isOnline: v.optional(v.boolean()),
  })
    .index('by_clerk_id', ['clerkId'])
    .index('by_username', ['username'])
    .index('by_email', ['email']),

  servers: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    inviteCode: v.string(),
    ownerId: v.id('users'),
  })
    .index('by_invite_code', ['inviteCode'])
    .index('by_owner', ['ownerId']),

  channels: defineTable({
    name: v.string(),
    type: v.union(v.literal('text'), v.literal('voice'), v.literal('video')),
    serverId: v.id('servers'),
    category: v.optional(v.string()),
  })
    .index('by_server', ['serverId'])
    .index('by_server_and_type', ['serverId', 'type'])
    // Used by the create mutation to enforce per-server name uniqueness in O(log n).
    .index('by_server_and_name', ['serverId', 'name']),

  members: defineTable({
    userId: v.id('users'),
    serverId: v.id('servers'),
    role: v.union(v.literal('owner'), v.literal('admin'), v.literal('member')),
  })
    .index('by_user', ['userId'])
    .index('by_server', ['serverId'])
    .index('by_user_and_server', ['userId', 'serverId']),

  messages: defineTable({
    content: v.string(),
    authorId: v.id('users'),
    channelId: v.id('channels'),
    fileUrl: v.optional(v.string()),
    fileType: v.optional(v.string()),
    deleted: v.optional(v.boolean()),
    editedAt: v.optional(v.number()),
  })
    .index('by_channel', ['channelId'])
    .index('by_author', ['authorId']),

  typingIndicators: defineTable({
    userId: v.id('users'),
    channelId: v.id('channels'),
    updatedAt: v.number(),
  })
    .index('by_channel', ['channelId'])
    .index('by_user_and_channel', ['userId', 'channelId']),

  // WebRTC signaling table
  signals: defineTable({
    fromUserId: v.id('users'),
    toUserId: v.id('users'),
    channelId: v.id('channels'),
    type: v.union(
      v.literal('offer'),
      v.literal('answer'),
      v.literal('ice-candidate')
    ),
    payload: v.string(), // JSON stringified SDP or ICE candidate
    processed: v.optional(v.boolean()),
  })
    .index('by_to_user', ['toUserId'])
    .index('by_channel', ['channelId'])
    .index('by_to_user_and_channel', ['toUserId', 'channelId'])
    // Used by receive to fetch unprocessed signals in O(log n) without a post-index filter.
    .index('by_to_user_channel_processed', ['toUserId', 'channelId', 'processed']),

  // Message reactions
  reactions: defineTable({
    messageId: v.id('messages'),
    userId: v.id('users'),
    emoji: v.string(),
  })
    .index('by_message', ['messageId'])
    .index('by_message_and_user', ['messageId', 'userId'])
    // Used by toggle to check existing reaction in O(log n) without a post-index filter.
    .index('by_message_user_emoji', ['messageId', 'userId', 'emoji']),

  // Voice channel participants
  voiceParticipants: defineTable({
    userId: v.id('users'),
    channelId: v.id('channels'),
    muted: v.optional(v.boolean()),
    deafened: v.optional(v.boolean()),
    cameraOn: v.optional(v.boolean()),
    joinedAt: v.number(),
  })
    .index('by_channel', ['channelId'])
    .index('by_user', ['userId'])
    .index('by_user_and_channel', ['userId', 'channelId']),
});
