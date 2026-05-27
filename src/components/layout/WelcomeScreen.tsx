interface WelcomeScreenProps {
  onCreateServer: () => void;
  onJoinServer: () => void;
}

export function WelcomeScreen({ onCreateServer, onJoinServer }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-discord-bg gap-6 p-8 text-center">
      <div className="text-6xl mb-4">👾</div>
      <h1 className="text-3xl font-bold text-white">
        Welcome to Discord Clone
      </h1>
      <p className="text-discord-muted text-lg max-w-md">
        Create a server to start chatting with friends, or join one with an invite code.
      </p>
      <div className="flex gap-4">
        <button
          onClick={onCreateServer}
          className="px-6 py-3 bg-discord-link hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
        >
          Create a Server
        </button>
        <button
          onClick={onJoinServer}
          className="px-6 py-3 bg-discord-input hover:bg-discord-hover text-white font-semibold rounded-lg transition-colors"
        >
          Join a Server
        </button>
      </div>
    </div>
  );
}
