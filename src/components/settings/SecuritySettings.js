'use client';
import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { api } from '@/lib/client-api';
export default function SecuritySettings({ onChanged, reportError }) {
  const [busy, setBusy] = useState(false);
  async function changePassword(event) {
    event.preventDefault();
    setBusy(true);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (values.password !== values.confirmPassword) {
      setBusy(false);
      return reportError('New passwords do not match.');
    }
    try {
      await api('/me/password', { method: 'POST', body: values });
      onChanged();
    } catch (error) {
      reportError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="settings-card">
      <div className="card-heading">
        <h2>
          <ShieldCheck size={19} /> Keep your account secure
        </h2>
        <p>Changing your password signs out all existing sessions.</p>
      </div>
      <form onSubmit={changePassword}>
        <label>
          Current password
          <input name="currentPassword" type="password" required autoComplete="current-password" />
        </label>
        <div className="form-grid">
          <label>
            New password
            <input
              name="password"
              type="password"
              minLength={8}
              maxLength={72}
              required
              autoComplete="new-password"
            />
          </label>
          <label>
            Confirm new password
            <input
              name="confirmPassword"
              type="password"
              minLength={8}
              maxLength={72}
              required
              autoComplete="new-password"
            />
          </label>
        </div>
        <div className="settings-form-footer">
          <span>At least 8 characters.</span>
          <button className="secondary-button" disabled={busy}>
            {busy ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </form>
    </section>
  );
}
