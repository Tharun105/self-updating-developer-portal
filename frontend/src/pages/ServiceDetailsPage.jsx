import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { docApi, serviceApi } from '../api/api';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import ServiceFormModal from '../components/ServiceFormModal.jsx';
import { ConfirmModal } from '../components/Modal.jsx';
import Loader, { EmptyState, ErrorBanner } from '../components/Loader.jsx';
import { errMsg, fmtDate, fmtDateTime, timeAgo } from '../utils/format.js';

export default function ServiceDetailsPage() {
  const { id } = useParams();
  const { canEdit } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [docs, setDocs] = useState([]);
  const [error, setError] = useState('');
  const [edit, setEdit] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, d] = await Promise.all([serviceApi.get(id), docApi.list({ serviceId: id })]);
      setService(s);
      setDocs(d);
      setError('');
    } catch (e) {
      setError(errMsg(e));
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const remove = async () => {
    setBusy(true);
    try {
      await serviceApi.remove(id);
      toast.success('Service deleted.');
      navigate('/services', { replace: true });
    } catch (e) {
      toast.error(errMsg(e));
      setBusy(false);
    }
  };

  if (error) return <><Link to="/services">Back to services</Link><div className="mt-3"><ErrorBanner message={error} onRetry={load} /></div></>;
  if (!service) return <Loader />;

  const facts = [
    ['Owner', service.owner], ['Language', service.language], ['Version', service.version],
    ['Source', <StatusBadge key="s" value={service.source} />],
    ['Created', fmtDate(service.createdAt)], ['Last updated', `${fmtDateTime(service.lastUpdated)} (${timeAgo(service.lastUpdated)})`],
  ];

  return (
    <>
      <nav className="mb-3 small"><Link to="/services"><i className="bi bi-arrow-left" /> Services</Link></nav>
      <div className="page-head">
        <div>
          <h1 className="mono d-flex align-items-center gap-2 flex-wrap">{service.name} <StatusBadge value={service.status} /></h1>
          <p>{service.description || 'No description provided.'}</p>
        </div>
        {canEdit && (
          <div className="d-flex gap-2">
            <button className="btn btn-light" onClick={() => setEdit(true)}><i className="bi bi-pencil me-1" />Edit</button>
            <button className="btn btn-outline-danger" onClick={() => setConfirm(true)}><i className="bi bi-trash me-1" />Delete</button>
          </div>
        )}
      </div>

      <div className="row g-3">
        <div className="col-lg-5">
          <div className="panel mb-3">
            <div className="panel-head"><h2>Metadata</h2></div>
            <div className="panel-body">
              <dl className="row mb-0">
                {facts.map(([k, v]) => (
                  <div className="row mb-2 mx-0 px-0" key={k}>
                    <dt className="col-5 fw-normal text-muted">{k}</dt>
                    <dd className="col-7 mb-0">{v || '—'}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <div className="panel">
            <div className="panel-head"><h2>Links</h2></div>
            <div className="panel-body d-grid gap-2">
              {service.repoUrl ? (
                <a className="btn btn-light text-start" href={service.repoUrl} target="_blank" rel="noreferrer"><i className="bi bi-github me-2" />Repository</a>
              ) : <span className="text-muted small">No repository URL.</span>}
              {service.apiDocUrl && (
                <a className="btn btn-light text-start" href={service.apiDocUrl} target="_blank" rel="noreferrer"><i className="bi bi-braces me-2" />API specification</a>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="panel">
            <div className="panel-head">
              <h2>Documentation ({docs.length})</h2>
              <Link className="small" to={`/docs?serviceId=${service.id}`}>Open in documentation</Link>
            </div>
            {docs.length === 0 ? (
              <EmptyState icon="bi-journal" title="No documentation yet">Docs appear after a sync finds a README, or add one in Documentation.</EmptyState>
            ) : docs.map((d) => (
              <Link key={d.id} to={`/docs?serviceId=${service.id}&doc=${d.id}`} className="doc-item text-decoration-none text-body">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-medium">{d.title}</span><StatusBadge value={d.type} />
                </div>
                <div className="small text-muted">Updated {timeAgo(d.updatedAt)}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <ServiceFormModal show={edit} service={service} onClose={() => setEdit(false)} onSaved={load} />
      <ConfirmModal show={confirm} title="Delete service" busy={busy} onClose={() => setConfirm(false)} onConfirm={remove}
        message={`Delete ${service.name} and its documentation?`} />
    </>
  );
}
