import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { githubApi, syncApi } from '../api/api';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import useDebounce from '../hooks/useDebounce.js';
import StatusBadge from '../components/StatusBadge.jsx';
import SyncHistoryTable from '../components/SyncHistoryTable.jsx';
import Loader, { EmptyState, ErrorBanner } from '../components/Loader.jsx';
import { errMsg, timeAgo } from '../utils/format.js';

export default function GithubPage() {
  const { canEdit } = useAuth();
  const toast = useToast();
  const [owner, setOwner] = useState('');
  const [ownerError, setOwnerError] = useState('');
  const [q, setQ] = useState('');
  const [repos, setRepos] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(null);
  const dq = useDebounce(q);

  const load = useCallback(async () => {
    try {
      const [r, h] = await Promise.all([githubApi.repos(dq), syncApi.history(10)]);
      setRepos(r);
      setHistory(h);
      setError('');
    } catch (e) {
      setError(errMsg(e));
    }
  }, [dq]);

  useEffect(() => { load(); }, [load]);

  const discover = async (e) => {
    e.preventDefault();
    const name = owner.trim();
    if (name && !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(name)) {
      setOwnerError('Enter a valid GitHub username or organisation.');
      return;
    }
    setOwnerError('');
    setSyncing(true);
    try {
      const h = await syncApi.run(name || undefined);
      (h.status === 'FAILED' ? toast.error : toast.success)(`Sync ${h.status.toLowerCase()}: ${h.message}`);
      setOwner('');
      await load();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSyncing(false);
    }
  };

  const importRepo = async (r) => {
    setImporting(r.id);
    try {
      await githubApi.importRepo(r.id);
      toast.success(`${r.name} added to the catalogue.`);
      await load();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setImporting(null);
    }
  };

  return (
    <>
      <div className="page-head">
        <div><h1>GitHub integration</h1><p>Discover repositories and keep service metadata in sync.</p></div>
      </div>

      <div className="panel mb-4">
        <div className="panel-head"><h2>Discover repositories</h2></div>
        <div className="panel-body">
          {canEdit ? (
            <form className="row g-2 align-items-start" onSubmit={discover} noValidate>
              <div className="col-md-6 col-lg-5">
                <input className={`form-control ${ownerError ? 'is-invalid' : ''}`} value={owner} placeholder="GitHub username or organisation, e.g. octocat"
                  onChange={(e) => setOwner(e.target.value)} aria-label="GitHub owner" />
                {ownerError && <div className="invalid-feedback">{ownerError}</div>}
              </div>
              <div className="col-auto">
                <button className="btn btn-accent" disabled={syncing}>
                  {syncing ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-arrow-repeat me-2" />}
                  {owner.trim() ? 'Discover and sync' : 'Sync all owners'}
                </button>
              </div>
              <div className="col-12 small text-muted">
                A new owner is saved and included in every scheduled sync. Leave the field empty to sync the owners already tracked.
              </div>
            </form>
          ) : (
            <p className="mb-0 text-muted">You have read-only access. Ask a developer or admin to run a sync.</p>
          )}
        </div>
      </div>

      <ErrorBanner message={error} onRetry={load} />
      <div className="panel mb-4">
        <div className="panel-head">
          <h2>Discovered repositories{repos ? ` (${repos.length})` : ''}</h2>
          <input className="form-control form-control-sm w-auto" placeholder="Filter repositories" value={q}
            onChange={(e) => setQ(e.target.value)} aria-label="Filter repositories" />
        </div>
        {!repos ? <Loader /> : repos.length === 0 ? (
          <EmptyState icon="bi-github" title="No repositories discovered">Enter a GitHub owner above and run a sync.</EmptyState>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead><tr><th>Repository</th><th>Owner</th><th>Language</th><th className="text-end">Stars</th><th>Updated</th><th>Catalogue</th><th /></tr></thead>
              <tbody>
                {repos.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <a className="svc-name" href={r.url} target="_blank" rel="noreferrer">{r.name}</a>
                      <div className="desc-clip">{r.description || 'No description'}</div>
                    </td>
                    <td>{r.owner}</td>
                    <td>{r.language || '—'}</td>
                    <td className="text-end">{r.stars}</td>
                    <td className="text-nowrap">{timeAgo(r.lastUpdated)}</td>
                    <td>{r.serviceLinked ? <span className="badge rounded-pill text-bg-success">Linked</span> : <span className="badge rounded-pill text-bg-secondary">Not linked</span>}</td>
                    <td className="text-end">
                      {canEdit && !r.serviceLinked && (
                        <button className="btn btn-sm btn-light" disabled={importing === r.id} onClick={() => importRepo(r)}>
                          {importing === r.id ? <span className="spinner-border spinner-border-sm" /> : 'Add as service'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-head"><h2>Synchronization history</h2><Link to="/" className="small">Dashboard</Link></div>
        <SyncHistoryTable rows={history} />
      </div>
    </>
  );
}
