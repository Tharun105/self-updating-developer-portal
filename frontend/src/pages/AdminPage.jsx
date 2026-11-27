import { useCallback, useEffect, useState } from 'react';
import { dashboardApi, syncApi, userApi } from '../api/api';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import SyncHistoryTable from '../components/SyncHistoryTable.jsx';
import Modal, { ConfirmModal } from '../components/Modal.jsx';
import Loader, { ErrorBanner } from '../components/Loader.jsx';
import { errMsg, fieldErrors, fmtDate } from '../utils/format.js';

const EMPTY = { username: '', email: '', password: '', role: 'VIEWER', enabled: true };

export default function AdminPage() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [o, u, h] = await Promise.all([dashboardApi.adminOverview(), userApi.list(), syncApi.history(10)]);
      setOverview(o); setUsers(u); setHistory(h); setError('');
    } catch (e) {
      setError(errMsg(e));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openForm = (u) => {
    setErrors({});
    setEditId(u?.id ?? null);
    setForm(u ? { username: u.username, email: u.email, password: '', role: u.role, enabled: u.enabled } : EMPTY);
  };

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    const er = {};
    if (form.username.trim().length < 3) er.username = 'Username needs at least 3 characters.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) er.email = 'Enter a valid email address.';
    if (!editId && form.password.length < 6) er.password = 'Password needs at least 6 characters.';
    if (editId && form.password && form.password.length < 6) er.password = 'Password needs at least 6 characters.';
    setErrors(er);
    if (Object.keys(er).length) return;
    setSaving(true);
    try {
      if (editId) await userApi.update(editId, form); else await userApi.create(form);
      toast.success(editId ? 'User saved.' : 'User created.');
      setForm(null);
      load();
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await userApi.remove(deleting.id);
      toast.success(`${deleting.username} deleted.`);
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(errMsg(e));
      setDeleting(null);
    }
  };

  const sync = async () => {
    setSyncing(true);
    try {
      const h = await syncApi.run();
      (h.status === 'FAILED' ? toast.error : toast.success)(`Sync ${h.status.toLowerCase()}: ${h.message}`);
      load();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div><h1>Admin dashboard</h1><p>Users, access and synchronization settings.</p></div>
        <button className="btn btn-accent" onClick={sync} disabled={syncing}>
          {syncing ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-arrow-repeat me-2" />}Run sync
        </button>
      </div>
      <ErrorBanner message={error} onRetry={load} />
      {!overview && !error && <Loader />}

      {overview && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-6 col-lg-3"><StatCard label="Users" value={overview.totalUsers} icon="bi-people" tone="ink" /></div>
            <div className="col-6 col-lg-3"><StatCard label="Admins / developers" value={`${overview.usersByRole.ADMIN} / ${overview.usersByRole.DEVELOPER}`} icon="bi-shield-check" tone="teal" /></div>
            <div className="col-6 col-lg-3"><StatCard label="Total syncs" value={overview.totalSyncs} icon="bi-arrow-repeat" tone="ink" /></div>
            <div className="col-6 col-lg-3"><StatCard label="Failed syncs" value={overview.failedSyncs} icon="bi-exclamation-triangle" tone={overview.failedSyncs ? 'rust' : 'teal'} /></div>
          </div>

          <div className="panel mb-4">
            <div className="panel-head"><h2>Synchronization settings</h2></div>
            <div className="panel-body row g-3 small">
              <div className="col-md-3"><div className="text-muted">Scheduler</div><StatusBadge value={overview.schedulerEnabled ? 'ACTIVE' : 'INACTIVE'} /></div>
              <div className="col-md-3"><div className="text-muted">Cron expression</div><code>{overview.schedulerCron}</code></div>
              <div className="col-md-3"><div className="text-muted">Configured GitHub owners</div>{overview.githubOwners || '—'}</div>
              <div className="col-md-3"><div className="text-muted">GitHub token</div>{overview.githubTokenConfigured ? 'Configured' : 'Not set (60 requests/hour limit)'}</div>
              <div className="col-12 text-muted">Change these in <code>application.properties</code> or with environment variables, then restart the backend.</div>
            </div>
          </div>
        </>
      )}

      <div className="panel mb-4">
        <div className="panel-head">
          <h2>Users</h2>
          <button className="btn btn-sm btn-accent" onClick={() => openForm(null)}><i className="bi bi-person-plus me-1" />Add user</button>
        </div>
        {!users ? <Loader /> : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th /></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="fw-medium">{u.username}{u.username === me.username && <span className="text-muted small"> (you)</span>}</td>
                    <td>{u.email}</td>
                    <td><StatusBadge value={u.role} /></td>
                    <td><StatusBadge value={u.enabled ? 'ACTIVE' : 'INACTIVE'} /></td>
                    <td>{fmtDate(u.createdAt)}</td>
                    <td className="text-end text-nowrap">
                      <button className="btn btn-sm btn-light me-1" onClick={() => openForm(u)} title="Edit"><i className="bi bi-pencil" /></button>
                      <button className="btn btn-sm btn-light text-danger" disabled={u.username === me.username} onClick={() => setDeleting(u)} title="Delete"><i className="bi bi-trash" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-head"><h2>Recent synchronizations</h2></div>
        <SyncHistoryTable rows={history} />
      </div>

      <Modal show={!!form} onClose={() => setForm(null)} size="md" title={editId ? 'Edit user' : 'Add user'}
        footer={<>
          <button className="btn btn-light" onClick={() => setForm(null)}>Cancel</button>
          <button type="submit" form="user-form" className="btn btn-accent" disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2" />}Save user
          </button>
        </>}>
        {form && (
          <form id="user-form" onSubmit={save} noValidate>
            {[['username', 'Username', 'text'], ['email', 'Email', 'email'],
              ['password', editId ? 'New password (leave blank to keep)' : 'Password', 'password']].map(([n, l, t]) => (
              <div className="mb-3" key={n}>
                <label className="form-label" htmlFor={`u-${n}`}>{l}</label>
                <input id={`u-${n}`} name={n} type={t} value={form[n]} onChange={set} autoComplete="off"
                  className={`form-control ${errors[n] ? 'is-invalid' : ''}`} />
                {errors[n] && <div className="invalid-feedback">{errors[n]}</div>}
              </div>
            ))}
            <div className="mb-3">
              <label className="form-label" htmlFor="u-role">Role</label>
              <select id="u-role" name="role" value={form.role} onChange={set} className="form-select">
                <option value="VIEWER">Viewer (read only)</option>
                <option value="DEVELOPER">Developer (manage services, sync)</option>
                <option value="ADMIN">Admin (everything, including users)</option>
              </select>
            </div>
            <div className="form-check form-switch">
              <input id="u-enabled" name="enabled" type="checkbox" className="form-check-input" checked={form.enabled} onChange={set} />
              <label className="form-check-label" htmlFor="u-enabled">Account enabled</label>
            </div>
          </form>
        )}
      </Modal>
      <ConfirmModal show={!!deleting} title="Delete user" message={`Delete ${deleting?.username}? They will no longer be able to sign in.`}
        onClose={() => setDeleting(null)} onConfirm={remove} />
    </>
  );
}
