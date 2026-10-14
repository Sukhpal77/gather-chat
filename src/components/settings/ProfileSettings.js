'use client';
import { useRef, useState } from 'react';
import { Camera, Check } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { api } from '@/lib/client-api';

export default function ProfileSettings({ user, onUpdated, reportError }) {
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const input = useRef(null);
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setSaved(false);
    try {
      const data = await api('/me', {
        method: 'PATCH',
        body: Object.fromEntries(new FormData(event.currentTarget)),
      });
      onUpdated(data.user);
      setSaved(true);
    } catch (error) {
      reportError(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function avatar(file) {
    if (!file) return;
    setBusy(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const { attachment } = await api('/files', { method: 'POST', body });
      const data = await api('/me', { method: 'PATCH', body: { avatar: attachment.url } });
      onUpdated(data.user);
    } catch (error) {
      reportError(error.message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }
  return (
    <section className="settings-card">
      <div className="card-heading">
        <h2>Your profile</h2>
        <p>A familiar face and a little about you.</p>
      </div>
      <div className="profile-edit">
        <Avatar person={user} size="large" />
        <div>
          <strong>{user.name}</strong>
          <span>@{user.username}</span>
          <button className="text-button" disabled={busy} onClick={() => input.current?.click()}>
            <Camera size={15} /> Change photo
          </button>
          <input
            ref={input}
            type="file"
            className="visually-hidden"
            tabIndex={-1}
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => avatar(e.target.files[0])}
          />
        </div>
      </div>
      <form onSubmit={save}>
        <div className="form-grid">
          <label>
            Full name
            <input
              name="name"
              defaultValue={user.name}
              required
              maxLength={80}
              autoComplete="name"
            />
          </label>
          <label>
            Status
            <input
              name="status"
              defaultValue={user.status}
              maxLength={80}
              placeholder="What’s on your mind?"
            />
          </label>
        </div>
        <label>
          Bio
          <textarea
            name="bio"
            defaultValue={user.bio}
            rows={3}
            maxLength={240}
            placeholder="A little about yourself"
          />
        </label>
        <div className="form-grid">
          <label>
            Phone <span className="optional">private</span>
            <input name="mobile" defaultValue={user.mobile} maxLength={30} autoComplete="tel" />
          </label>
          <label>
            Location <span className="optional">private</span>
            <input
              name="address"
              defaultValue={user.address}
              maxLength={160}
              autoComplete="street-address"
            />
          </label>
        </div>
        <div className="settings-form-footer">
          <span>
            {saved && (
              <>
                <Check size={15} /> Profile saved
              </>
            )}
          </span>
          <button className="primary-button" disabled={busy}>
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </section>
  );
}
