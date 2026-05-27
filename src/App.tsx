import { useState, useEffect } from 'react';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';

import { ServerList } from './components/layout/ServerList';
import { ChannelSidebar } from './components/layout/ChannelSidebar';
import { WelcomeScreen } from './components/layout/WelcomeScreen';
import { NoChannelSelected } from './components/layout/NoChannelSelected';
import { ChatArea } from './components/chat/ChatArea';
import { VoiceArea } from './components/voice/VoiceArea';
import { CreateServerModal } from './components/server/CreateServerModal';
import { JoinServerModal } from './components/server/JoinServerModal';
import { CreateChannelModal } from './components/server/CreateChannelModal';
import { InviteModal } from './components/server/InviteModal';
import { AuthScreen } from './components/auth/AuthScreen';

type Modal = 'create-server' | 'join-server' | 'create-channel' | 'invite' | null;

function DiscordApp() {
  const { user } = useUser();
  const upsertUser = useMutation(api.users.upsertFromClerk);
  const setOnline = useMutation(api.users.setOnlineStatus);
  const leaveServer = useMutation(api.servers.leave);
  const deleteServer = useMutation(api.servers.remove);

  const [selectedServerId, setSelectedServerId] = useState<Id<'servers'> | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<Id<'channels'> | null>(null);
  const [selectedChannelType, setSelectedChannelType] = useState<'text' | 'voice' | 'video'>('text');
  const [activeVoiceChannelId, setActiveVoiceChannelId] = useState<Id<'channels'> | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

  const server = useQuery(
    api.servers.getById,
    selectedServerId ? { serverId: selectedServerId } : 'skip'
  );

  useEffect(() => {
    if (!user) return;
    const name = user.fullName ?? user.username ?? 'Unknown';
    upsertUser({
      clerkId: user.id,
      name,
      username: user.username ?? user.id,
      email: user.emailAddresses[0]?.emailAddress ?? '',
      imageUrl: user.imageUrl,
    });
    setOnline({ clerkId: user.id, isOnline: true });

    return () => {
      setOnline({ clerkId: user.id, isOnline: false });
    };
  }, [user?.id]);

  function handleSelectChannel(id: Id<'channels'>, type: 'text' | 'voice' | 'video') {
    setSelectedChannelId(id);
    setSelectedChannelType(type);
    if (type !== 'text') setActiveVoiceChannelId(id);
  }

  function handleLeaveVoice() {
    setActiveVoiceChannelId(null);
    if (selectedChannelType !== 'text') setSelectedChannelId(null);
  }

  async function handleLeaveServer() {
    if (!user || !selectedServerId) return;
    if (!confirm(`Leave ${server?.name}?`)) return;
    await leaveServer({ serverId: selectedServerId, clerkId: user.id });
    setSelectedServerId(null);
    setSelectedChannelId(null);
  }

  async function handleDeleteServer() {
    if (!user || !selectedServerId) return;
    if (!confirm(`Permanently delete "${server?.name}"? This cannot be undone.`)) return;
    await deleteServer({ serverId: selectedServerId, clerkId: user.id });
    setSelectedServerId(null);
    setSelectedChannelId(null);
  }

  const isVoiceChannel = selectedChannelType !== 'text' && selectedChannelId === activeVoiceChannelId;

  return (
    <div className="flex h-screen overflow-hidden">
      <ServerList
        selectedServerId={selectedServerId}
        onSelectServer={(id) => {
          setSelectedServerId(id);
          setSelectedChannelId(null);
          setActiveVoiceChannelId(null);
        }}
        onCreateServer={() => setModal('create-server')}
        onJoinServer={() => setModal('join-server')}
      />

      {selectedServerId ? (
        <>
          <ChannelSidebar
            serverId={selectedServerId}
            selectedChannelId={selectedChannelId}
            onSelectChannel={handleSelectChannel}
            onCreateChannel={() => setModal('create-channel')}
            onInvite={() => setModal('invite')}
            activeVoiceChannelId={activeVoiceChannelId}
            isMuted={isMuted}
            isDeafened={isDeafened}
            onToggleMute={() => setIsMuted((v) => !v)}
            onToggleDeafen={() => setIsDeafened((v) => !v)}
            onLeaveVoice={handleLeaveVoice}
            onLeaveServer={handleLeaveServer}
            onDeleteServer={handleDeleteServer}
          />

          {!selectedChannelId ? (
            <NoChannelSelected serverName={server?.name ?? ''} />
          ) : isVoiceChannel ? (
            <VoiceArea channelId={selectedChannelId} onLeave={handleLeaveVoice} />
          ) : (
            <ChatArea channelId={selectedChannelId} />
          )}
        </>
      ) : (
        <WelcomeScreen
          onCreateServer={() => setModal('create-server')}
          onJoinServer={() => setModal('join-server')}
        />
      )}

      {modal === 'create-server' && (
        <CreateServerModal
          onClose={() => setModal(null)}
          onCreated={(id) => { setSelectedServerId(id); setSelectedChannelId(null); setModal(null); }}
        />
      )}
      {modal === 'join-server' && (
        <JoinServerModal
          onClose={() => setModal(null)}
          onJoined={(id) => { setSelectedServerId(id); setSelectedChannelId(null); setModal(null); }}
        />
      )}
      {modal === 'create-channel' && selectedServerId && (
        <CreateChannelModal
          serverId={selectedServerId}
          onClose={() => setModal(null)}
          onCreated={(channelId) => {
            setSelectedChannelId(channelId);
            setSelectedChannelType('text');
            setModal(null);
          }}
        />
      )}
      {modal === 'invite' && selectedServerId && (
        <InviteModal serverId={selectedServerId} onClose={() => setModal(null)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <>
      <SignedIn>
        <DiscordApp />
      </SignedIn>
      <SignedOut>
        <AuthScreen />
      </SignedOut>
    </>
  );
}
