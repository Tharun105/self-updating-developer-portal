import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { serviceApi } from '../api/api';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import useDebounce from '../hooks/useDebounce.js';
import StatusBadge from '../components/StatusBadge.jsx';
import Pagination from '../components/Pagination.jsx';
import ServiceFormModal from '../components/ServiceFormModal.jsx';
import { ConfirmModal } from '../components/Modal.jsx';
import Loader, { EmptyState, ErrorBanner } from '../components/Loader.jsx';
import { errMsg, timeAgo } from '../utils/format.js';

const SORTS = [
  { v: 'lastUpdated,desc', l: 'Recently updated' },
  { v: 'name,asc', l: 'Name (A-Z)' },
  { v: 'name,desc', l: 'Name (Z-A)' },
  { v: 'createdAt,desc', l: 'Newest first' },
];

export default function ServicesPage() {
  const { canEdit } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [language, setLanguage] = useState('');
  const [sort, setSort] = useState(SORTS[0].v);
  const [page, setPage] = useState(0);
  const [languages, setLanguages] = useState([]);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const dq = useDebounce(q);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await serviceApi.list({ q: dq || undefined, status: status || undefined, language: language || undefined, sort, page, size: 10 }));
      setError('');
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [dq, status, language, sort, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(0); }, [dq, status, language, sort]);
  useEffect(() => { serviceApi.languages().then(setLanguages).catch(() => {}); }, [data?.totalElements]);

  const remove = async () => {
    setBusy(true);
    try {
      await serviceApi.remove(deleting.id);
      toast.success(`${deleting.name} deleted.`);
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const clear = () => { setQ(''); setStatus(''); setLanguage(''); };
  const filtered = q || status || language;

  return (
    <>
      <div className="page-head">
        <div><h1>Services</h1><p>{data ? `${data.totalElements} services in the catalogue` : 'Search and manage your services'}</p></div>
        {canEdit && (
          <button className="btn btn-accent" onClick={() => { setEditing(null); setShowForm(true); }}>
            <i className="bi bi-plus-lg me-1" /> Add service
          </button>
        )}
      </div>

      <div className="panel mb-3">
        <div className="panel-body row g-2">
          <div className="col-lg-4">
            <div className="input-group">
              <span className="input-group-text bg-white"><i className="bi bi-search" /></span>
              <input className="form-control" placeholder="Search name, description or owner" value={q}
                onChange={(e) => setQ(e.target.value)} aria-label="Search services" />
            </div>
          </div>
          <div className="col-6 col-lg-2">
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
              <option value="">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div className="col-6 col-lg-2">
            <select className="form-select" value={language} onChange={(e) => setLanguage(e.target.value)} aria-label="Filter by language">
              <option value="">All languages</option>
              {languages.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="col-8 col-lg-3">
            <select className="form-select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
              {SORTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </div>
          <div className="col-4 col-lg-1">
            <button className="btn btn-light w-100" onClick={clear} disabled={!filtered}>Clear</button>
          </div>
        </div>
      </div>

      <ErrorBanner message={error} onRetry={load} />
      <div className="panel">
        {loading && !data ? <Loader /> : data?.content.length === 0 ? (
          <EmptyState icon="bi-search" title={filtered ? 'No services match these filters' : 'No services yet'}>
            {filtered ? 'Try a different search or clear the filters.' : 'Run a GitHub sync or add a service manually.'}
          </EmptyState>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead><tr><th>Service</th><th>Owner</th><th>Language</th><th>Status</th><th>Source</th><th>Updated</th><th /></tr></thead>
              <tbody>
                {data?.content.map((s) => (
                  <tr key={s.id} className="row-link" onClick={() => navigate(`/services/${s.id}`)}>
                    <td>
                      <Link className="svc-name" to={`/services/${s.id}`} onClick={(e) => e.stopPropagation()}>{s.name}</Link>
                      <div className="desc-clip">{s.description || 'No description'}</div>
                    </td>
                    <td>{s.owner || '—'}</td>
                    <td>{s.language || '—'}</td>
                    <td><StatusBadge value={s.status} /></td>
                    <td><StatusBadge value={s.source} /></td>
                    <td className="text-nowrap">{timeAgo(s.lastUpdated)}</td>
                    <td className="text-end text-nowrap" onClick={(e) => e.stopPropagation()}>
                      <Link className="btn btn-sm btn-light me-1" to={`/services/${s.id}`} title="View"><i className="bi bi-eye" /></Link>
                      {canEdit && (
                        <>
                          <button className="btn btn-sm btn-light me-1" title="Edit" onClick={() => { setEditing(s); setShowForm(true); }}><i className="bi bi-pencil" /></button>
                          <button className="btn btn-sm btn-light text-danger" title="Delete" onClick={() => setDeleting(s)}><i className="bi bi-trash" /></button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.totalPages > 1 && (
          <div className="panel-body border-top"><Pagination page={page} totalPages={data.totalPages} onChange={setPage} /></div>
        )}
      </div>

      <ServiceFormModal show={showForm} service={editing} onClose={() => setShowForm(false)} onSaved={load} />
      <ConfirmModal show={!!deleting} title="Delete service" busy={busy} onClose={() => setDeleting(null)} onConfirm={remove}
        message={`Delete ${deleting?.name}? Its documentation is deleted too. If it came from GitHub, the next sync can add it back.`} />
    </>
  );
}
