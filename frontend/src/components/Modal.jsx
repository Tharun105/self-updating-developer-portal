import { useEffect } from 'react';

export default function Modal({ show, title, onClose, children, footer, size = 'lg' }) {
  useEffect(() => {
    if (!show) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [show, onClose]);

  if (!show) return null;
  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true"
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <div className={`modal-dialog modal-${size} modal-dialog-centered modal-dialog-scrollable`}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}

export function ConfirmModal({ show, title, message, confirmLabel = 'Delete', busy, onConfirm, onClose }) {
  return (
    <Modal show={show} title={title} onClose={onClose} size="md"
      footer={
        <>
          <button className="btn btn-light" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" disabled={busy} onClick={onConfirm}>
            {busy && <span className="spinner-border spinner-border-sm me-2" />}{confirmLabel}
          </button>
        </>
      }>
      <p className="mb-0">{message}</p>
    </Modal>
  );
}
