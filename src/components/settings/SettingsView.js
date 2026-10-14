import ProfileSettings from './ProfileSettings';
import PreferencesSettings from './PreferencesSettings';
import SecuritySettings from './SecuritySettings';
export default function SettingsView({
  user,
  onUpdated,
  onPasswordChanged,
  onLogout,
  reportError,
}) {
  return (
    <section className="feature-view settings-view">
      <header className="feature-header">
        <span className="eyebrow">YOUR OWN LITTLE SPACE</span>
        <h1>
          Make yourself
          <br />
          at home<span>.</span>
        </h1>
        <p>Your profile, your preferences, your way.</p>
      </header>
      <div className="settings-layout">
        <div>
          <ProfileSettings user={user} onUpdated={onUpdated} reportError={reportError} />
          <PreferencesSettings user={user} onUpdated={onUpdated} reportError={reportError} />
          <SecuritySettings onChanged={onPasswordChanged} reportError={reportError} />
          <button className="secondary-button" onClick={onLogout}>
            Sign out of Gather
          </button>
        </div>
        <aside className="settings-note">
          <span>✳</span>
          <h3>Keep it personal.</h3>
          <p>
            Your email, phone, and location stay private. Your name, photo, bio, and status help
            your circle recognize you.
          </p>
          <div>
            ACCOUNT EMAIL<strong>{user.email}</strong>
          </div>
          <div>
            USERNAME<strong>@{user.username}</strong>
          </div>
        </aside>
      </div>
    </section>
  );
}
