'use client';
import { useEffect, useState } from 'react';
import { FileText, Image, Music, Download } from 'lucide-react';
import { api } from '@/lib/client-api';
import { fileSize } from '@/lib/format';
export default function SharedFiles({ conversation }) {
  const [files, setFiles] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api(`/conversations/${conversation.id}/files`, { signal: controller.signal })
      .then((data) => {
        setFiles(data.files);
        setHasMore(data.hasMore);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [conversation.id, conversation.lastMessageAt]);
  async function older() {
    setLoading(true);
    try {
      const data = await api(`/conversations/${conversation.id}/files?before=${files.at(-1).id}`);
      setFiles((previous) => [...previous, ...data.files]);
      setHasMore(data.hasMore);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="shared-files">
      {files.map((message) => {
        const file = message.attachment;
        if (!file) return null;
        const Icon = file.mime.startsWith('image/')
          ? Image
          : file.mime.startsWith('audio/')
            ? Music
            : FileText;
        return (
          <a
            className="shared-file-row"
            key={message.id}
            href={file.url}
            target="_blank"
            rel="noreferrer"
          >
            <Icon size={19} />
            <span>
              <strong>{file.name}</strong>
              <small>
                {fileSize(file.size)} · {message.sender.name}
              </small>
            </span>
            <Download size={14} />
          </a>
        );
      })}
      {!loading && !files.length && !error && <p>No files shared yet.</p>}
      {loading && <p>Loading files…</p>}
      {error && <p role="alert">{error}</p>}
      {hasMore && (
        <button className="text-button" disabled={loading} onClick={older}>
          Load more files
        </button>
      )}
    </div>
  );
}
