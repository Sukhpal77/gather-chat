'use client';
import { Moon, Sun, Volume2 } from 'lucide-react';
import { api } from '@/lib/client-api';
export default function PreferencesSettings({ user, onUpdated, reportError }) {
  async function update(preferences) {
    try {
      const data = await api('/me', { method: 'PATCH', body: { preferences } });
      onUpdated(data.user);
    } catch (error) {
      reportError(error.message);
    }
  }
  return (
    <section className="settings-card">
      <div className="card-heading">
        <h2>Make it feel like you</h2>
        <p>A few small touches for your space.</p>
      </div>
      <div className="preference-row">
        <span>
          <Sun size={20} />
          <span>
            <strong>Appearance</strong>
            <small>Choose a light or dark workspace.</small>
          </span>
        </span>
        <div className="theme-switch">
          <button
            className={user.preferences?.theme !== 'dark' ? 'active' : ''}
            aria-pressed={user.preferences?.theme !== 'dark'}
            onClick={() => update({ theme: 'light' })}
          >
            <Sun size={15} /> Light
          </button>
          <button
            className={user.preferences?.theme === 'dark' ? 'active' : ''}
            aria-pressed={user.preferences?.theme === 'dark'}
            onClick={() => update({ theme: 'dark' })}
          >
            <Moon size={15} /> Dark
          </button>
        </div>
      </div>
      <div className="preference-row">
        <span>
          <Volume2 size={20} />
          <span>
            <strong>Message sounds</strong>
            <small>A gentle sound for incoming messages.</small>
          </span>
        </span>
        <button
          className={`toggle ${user.preferences?.sound !== false ? 'on' : ''}`}
          role="switch"
          aria-checked={user.preferences?.sound !== false}
          aria-label="Message sounds"
          onClick={() => update({ sound: user.preferences?.sound === false })}
        >
          <i />
        </button>
      </div>
    </section>
  );
}
