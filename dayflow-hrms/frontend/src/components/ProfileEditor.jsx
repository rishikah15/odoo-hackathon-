import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function ProfileEditor() {
  const [profile, setProfile] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getMyProfile().then(setProfile).catch((e) => setError(e.message));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSaved(false);
    try {
      const updated = await api.updateMyProfile({
        name: profile.name,
        department: profile.department,
        phone: profile.phone,
      });
      setProfile(updated);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!profile) return <p>Loading profile...</p>;

  return (
    <form onSubmit={handleSave} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
      <h3>My profile</h3>
      <label>
        Name
        <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} style={{ display: 'block', marginBottom: 8 }} />
      </label>
      <label>
        Department
        <input value={profile.department || ''} onChange={(e) => setProfile({ ...profile, department: e.target.value })} style={{ display: 'block', marginBottom: 8 }} />
      </label>
      <label>
        Phone
        <input value={profile.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} style={{ display: 'block', marginBottom: 8 }} />
      </label>
      <p style={{ fontSize: 12, color: '#666' }}>Email: {profile.email} · Role: {profile.role} (not editable)</p>
      {error && <p role="alert" style={{ color: 'crimson' }}>{error}</p>}
      {saved && <p style={{ color: '#2e7d32' }}>Saved.</p>}
      <button type="submit">Save changes</button>
    </form>
  );
}
