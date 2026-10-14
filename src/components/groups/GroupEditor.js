'use client';
import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { api } from '@/lib/client-api';
export default function GroupEditor({ group, actions }) {
  const input = useRef(null);
  const [uploading, setUploading] = useState(false);
  async function photo(file) {
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const { attachment } = await api('/files', { method: 'POST', body });
      await actions.update({ avatar: attachment.url });
    } catch (error) {
      actions.setError(error.message);
    } finally {
      setUploading(false);
      if (input.current) input.current.value = '';
    }
  }
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        actions.update(Object.fromEntries(new FormData(event.currentTarget)));
      }}
    >
      <div className="profile-edit">
        <Avatar person={{ name: group.name, avatar: group.avatar }} group size="large" />
        <div>
          <strong>Group photo</strong>
          <span>Images up to 8 MB</span>
          <button
            type="button"
            className="text-button"
            disabled={uploading || actions.busy}
            onClick={() => input.current?.click()}
          >
            <Camera size={15} />
            {uploading ? 'Uploading…' : 'Change group photo'}
          </button>
          {group.avatar && (
            <button
              type="button"
              className="text-button"
              disabled={actions.busy}
              onClick={() => actions.update({ avatar: '' })}
            >
              Remove photo
            </button>
          )}
        </div>
        <input
          ref={input}
          type="file"
          className="visually-hidden"
          tabIndex={-1}
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(event) => photo(event.target.files[0])}
        />
      </div>
      <label>
        Group name
        <input name="name" required maxLength={80} defaultValue={group.name} />
      </label>
      <label>
        Group description
        <textarea
          name="description"
          rows={3}
          maxLength={240}
          defaultValue={group.description}
          placeholder="What brings your circle together?"
        />
      </label>
      <button className="primary-button full-width" disabled={actions.busy || uploading}>
        {actions.busy ? 'Saving…' : 'Save group details'}
      </button>
    </form>
  );
}
