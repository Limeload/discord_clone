import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConvexReactClient } from 'convex/react';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import App from './App.tsx';
import './index.css';

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;
const convexUrl = import.meta.env.VITE_CONVEX_URL as string;

function SetupRequired() {
  return (
    <div className="h-screen flex items-center justify-center bg-discord-bg text-discord-text p-8">
      <div className="max-w-lg w-full bg-discord-sidebar rounded-xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-2">Setup Required</h1>
        <p className="text-discord-muted mb-6">
          Add your keys to <code className="bg-discord-input px-1.5 py-0.5 rounded text-sm">.env.local</code> to get started.
        </p>
        <div className="space-y-3 text-sm font-mono bg-discord-channel-bg rounded-lg p-4">
          <div className={convexUrl ? 'text-discord-green' : 'text-discord-red'}>
            {convexUrl ? '✓' : '✗'} VITE_CONVEX_URL{convexUrl ? '' : '=<your convex url>'}
          </div>
          <div className={clerkKey ? 'text-discord-green' : 'text-discord-red'}>
            {clerkKey ? '✓' : '✗'} VITE_CLERK_PUBLISHABLE_KEY{clerkKey ? '' : '=pk_test_...'}
          </div>
        </div>
        <p className="text-discord-muted text-sm mt-6">
          Get your Clerk key at{' '}
          <span className="text-discord-link">dashboard.clerk.com</span>
          {' '}→ your app → API Keys.
        </p>
      </div>
    </div>
  );
}

const missingEnv = !clerkKey || !convexUrl;

if (missingEnv) {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <SetupRequired />
    </React.StrictMode>
  );
} else {
  const convex = new ConvexReactClient(convexUrl);

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ClerkProvider publishableKey={clerkKey}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <App />
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </React.StrictMode>
  );
}
