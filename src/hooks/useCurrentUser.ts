import { useUser } from '@clerk/clerk-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export function useCurrentUser() {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const convexUser = useQuery(
    api.users.getByClerkId,
    clerkUser ? { clerkId: clerkUser.id } : 'skip'
  );

  return {
    clerkUser,
    convexUser,
    isLoaded,
    isSignedIn,
  };
}
