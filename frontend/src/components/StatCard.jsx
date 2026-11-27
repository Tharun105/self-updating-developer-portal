export default function StatCard({ label, value, icon, tone = 'teal' }) {
  return (
    <div className="stat-card">
      <span className={`stat-icon tone-${tone}`}><i className={`bi ${icon}`} /></span>
      <div>
        <div className="stat-value">{value ?? '—'}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
