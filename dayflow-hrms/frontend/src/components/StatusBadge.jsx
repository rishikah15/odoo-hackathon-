const STYLES = {
  pending: { emoji: '🟡', label: 'Pending', color: '#b58900' },
  approved: { emoji: '🟢', label: 'Approved', color: '#2e7d32' },
  rejected: { emoji: '🔴', label: 'Rejected', color: '#c62828' },
};

export default function StatusBadge({ status }) {
  const s = STYLES[status] || STYLES.pending;
  return (
    <span style={{ color: s.color, fontWeight: 600 }}>
      {s.emoji} {s.label}
    </span>
  );
}
