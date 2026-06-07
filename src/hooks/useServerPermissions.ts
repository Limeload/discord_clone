import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

export function useServerPermissions(
  serverId: Id<'servers'>,
  convexUserId: Id<'users'> | null | undefined
) {
  const members = useQuery(api.servers.getMembers, { serverId });

  const myMembership = members?.find((m) => m.userId === convexUserId);
  const isOwner = myMembership?.role === 'owner' ?? false;
  const canManage = (isOwner || myMembership?.role === 'admin') ?? false;

  const onlineMembers = (members ?? []).filter((m) => m.user?.isOnline);
  const offlineMembers = (members ?? []).filter((m) => !m.user?.isOnline);

  return {
    members,
    myMembership,
    isOwner,
    canManage,
    onlineMembers,
    offlineMembers,
  };
}
