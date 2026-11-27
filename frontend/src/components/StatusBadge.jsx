const tone = {
  ACTIVE: 'success', INACTIVE: 'secondary',
  SUCCESS: 'success', PARTIAL: 'warning', FAILED: 'danger', RUNNING: 'info',
  ADMIN: 'danger', DEVELOPER: 'primary', VIEWER: 'secondary',
  MANUAL: 'secondary', SCHEDULED: 'info', GITHUB: 'dark',
  README: 'info', API: 'primary', GUIDE: 'secondary',
};

export default function StatusBadge({ value }) {
  if (!value) return null;
  return <span className={`badge rounded-pill text-bg-${tone[value] || 'secondary'}`}>{value}</span>;
}
