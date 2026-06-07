import { useState, useRef, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { Plus, Smile, Gift, Sticker, GripHorizontal } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useCurrentUser } from '../../hooks/useCurrentUser';

interface MessageInputProps {
  channelId: Id<'channels'>;
  channelName: string;
}

export function MessageInput({ channelId, channelName }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const MAX_FILE_SIZE = 25 * 1024 * 1024;
  const ALLOWED_TYPES = new Set([
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/ogg',
    'application/pdf', 'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]);
  const { clerkUser } = useCurrentUser();
  const sendMessage = useMutation(api.messages.send);
  const setTyping = useMutation(api.messages.setTyping);
  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
  const getFileUrl = useMutation(api.messages.getFileUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleTyping = useCallback(() => {
    if (!clerkUser) return;
    setTyping({ channelId, clerkId: clerkUser.id });
    clearTimeout(typingTimeoutRef.current);
  }, [channelId, clerkUser, setTyping]);

  async function handleSend() {
    if ((!content.trim() && !uploading) || !clerkUser) return;

    const text = content.trim();
    setContent('');

    await sendMessage({
      content: text || '📎',
      channelId,
      clerkId: clerkUser.id,
    });
  }

  async function handleFileUpload(file: File) {
    if (!clerkUser) return;

    setUploadError(null);

    if (!ALLOWED_TYPES.has(file.type)) {
      setUploadError('File type not supported. Allowed: images (JPEG, PNG, GIF, WebP), videos (MP4, WebM, OGG), PDF, plain text, and Word documents.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File too large. Maximum size is 25 MB.');
      return;
    }

    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl({ clerkId: clerkUser.id });
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      const { storageId } = await result.json();
      const fileUrl = await getFileUrl({ storageId, clerkId: clerkUser.id });

      await sendMessage({
        content: file.name,
        channelId,
        clerkId: clerkUser.id,
        fileUrl: fileUrl ?? undefined,
        fileType: file.type,
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="px-4 pb-6 pt-2">
      <div className="bg-discord-input rounded-lg flex items-center gap-2 px-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 text-discord-muted hover:text-discord-text transition-colors shrink-0"
          title="Upload file"
          disabled={uploading}
        >
          <Plus size={20} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,video/*,.pdf,.txt,.doc,.docx"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
            e.target.value = '';
          }}
        />

        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            handleTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={`Message #${channelName}`}
          className="flex-1 bg-transparent text-discord-text placeholder-discord-muted text-sm py-3 outline-none resize-none max-h-48 scrollbar-thin"
          rows={1}
          style={{ height: 'auto' }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 192) + 'px';
          }}
        />

        <div className="flex items-center gap-1 shrink-0">
          <button className="p-1.5 text-discord-muted hover:text-discord-text transition-colors">
            <Gift size={20} />
          </button>
          <button className="p-1.5 text-discord-muted hover:text-discord-text transition-colors">
            <GripHorizontal size={20} />
          </button>
          <button className="p-1.5 text-discord-muted hover:text-discord-text transition-colors">
            <Smile size={20} />
          </button>
          <button className="p-1.5 text-discord-muted hover:text-discord-text transition-colors">
            <Sticker size={20} />
          </button>
        </div>
      </div>

      {uploading && (
        <p className="text-xs text-discord-muted mt-1 px-1">Uploading file...</p>
      )}
      {uploadError && (
        <p className="text-xs text-red-400 mt-1 px-1">{uploadError}</p>
      )}
    </div>
  );
}
