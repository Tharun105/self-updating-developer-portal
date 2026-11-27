import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi, syncApi } from '../api/api';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import SyncHistoryTable from '../components/SyncHistoryTable.jsx';
import Loader, { EmptyState, ErrorBanner } from '../components/Loader.jsx';
import { errMsg, timeAgo } from '../utils/format.js';

export default function DashboardPage() {
  const { canEdit } = useAuth();
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    try {
      setStats(await dashboardApi.stats());
      setError('');
    } catch (e) {
      setError(errMsg(e));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sync = async () => {
    setSyncing(true);
    try {
      const h = await syncApi.run();
      (h.status === 'FAILED' ? toast.error : toast.success)(`Sync ${h.status.toLowerCase()}: ${h.message}`);
      await load();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSyncing(false);
    }
  };

  const maxLang = stats ? Math.max(1, ...Object.values(stats.languages)) : 1;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>{stats?.lastSync ? `Last sync ${timeAgo(stats.lastSync.startedAt)} (${stats.lastSync.status.toLowerCase()})` : 'No synchronization has run yet.'}</p>
        </div>
        {canEdit && (
          <button className="btn btn-accent" onClick={sync} disabled={syncing}>
            {syncing ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-arrow-repeat me-2" />}
            Sync now
          </button>
        )}
      </div>

      <ErrorBanner message={error} onRetry={load} />
      {!stats && !error && <Loader />}

      {stats && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-6 col-lg-4 col-xl-2"><StatCard label="Total services" value={stats.totalServices} icon="bi-boxes" tone="ink" /></div>
            <div className="col-6 col-lg-4 col-xl-2"><StatCard label="Discovered repositories" value={stats.discoveredRepositories} icon="bi-github" tone="teal" /></div>
            <div className="col-6 col-lg-4 col-xl-2"><StatCard label="Active services" value={stats.activeServices} icon="bi-activity" tone="teal" /></div>
            <div className="col-6 col-lg-4 col-xl-2"><StatCard label="Inactive services" value={stats.inactiveServices} icon="bi-pause-circle" tone="amber" /></div>
            <div className="col-6 col-lg-4 col-xl-2"><StatCard label="Documents" value={stats.totalDocuments} icon="bi-journal-text" tone="ink" /></div>
            <div className="col-6 col-lg-4 col-xl-2"><StatCard label="Last sync" value={stats.lastSync?.status ?? 'None'} icon="bi-arrow-repeat" tone={stats.lastSync?.status === 'FAILED' ? 'rust' : 'teal'} /></div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-lg-7">
              <div className="panel h-100">
                <div className="panel-head"><h2>Recently updated services</h2><Link to="/services" className="small">View all</Link></div>
                {stats.recentServices.length === 0 ? (
                  <EmptyState icon="bi-boxes" title="No services yet">Run a sync or add a service manually.</EmptyState>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead><tr><th>Service</th><th>Language</th><th>Status</th><th>Updated</th></tr></thead>
                      <tbody>
                        {stats.recentServices.map((s) => (
                          <tr key={s.id}>
                            <td><Link className="svc-name" to={`/services/${s.id}`}>{s.name}</Link></td>
                            <td>{s.language || '—'}</td>
                            <td><StatusBadge value={s.status} /></td>
                            <td className="text-nowrap">{timeAgo(s.lastUpdated)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            <div className="col-lg-5">
              <div className="panel h-100">
                <div className="panel-head"><h2>Services by language</h2></div>
                <div className="panel-body">
                  {Object.keys(stats.languages).length === 0 ? (
                    <EmptyState icon="bi-bar-chart" title="Nothing to chart yet" />
                  ) : (
                    Object.entries(stats.languages).slice(0, 8).map(([lang, n]) => (
                      <div className="bar-row" key={lang}>
                        <span className="text-truncate">{lang}</span>
                        <div className="bar-track"><div className="bar-fill" style={{ width: `${(n / maxLang) * 100}%` }} /></div>
                        <span className="text-end text-muted">{n}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head"><h2>Synchronization history</h2></div>
            <SyncHistoryTable rows={stats.syncHistory} />
          </div>
        </>
      )}
    </>
  );
}
