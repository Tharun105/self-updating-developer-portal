export default function Loader({ label = 'Loading…' }) {
  return (
    <div className="text-center text-muted py-5">
      <div className="spinner-border spinner-border-sm me-2" role="status" /> {label}
    </div>
  );
}

export function EmptyState({ icon = 'bi-inbox', title, children }) {
  return (
    <div className="text-center text-muted py-5">
      <i className={`bi ${icon} fs-1 d-block mb-2`} />
      <div className="fw-semibold text-body">{title}</div>
      {children && <div className="small mt-1">{children}</div>}
    </div>
  );
}

export function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="alert alert-danger d-flex align-items-center justify-content-between">
      <span><i className="bi bi-exclamation-triangle me-2" />{message}</span>
      {onRetry && <button className="btn btn-sm btn-outline-danger" onClick={onRetry}>Try again</button>}
    </div>
  );
}
