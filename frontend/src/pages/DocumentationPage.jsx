import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { docApi, serviceApi } from '../api/api';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import useDebounce from '../hooks/useDebounce.js';
import Modal, { ConfirmModal } from '../components/Modal.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Loader, { EmptyState, ErrorBanner } from '../components/Loader.jsx';
import { errMsg, fieldErrors, fmtDateTime, timeAgo } from '../utils/format.js';

const EMPTY = { title: '', content: '', type: 'GUIDE', sourceUrl: '', serviceId: '' };

export default function DocumentationPage() {
  const { canEdit } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const serviceId = params.get('serviceId') || '';
  const docId = params.get('doc');
  const [q, setQ] = useState('');
  const dq = useDebounce(q);
  const [docs, setDocs] = useState(null);
  const [services, setServices] = useState([]);
  const [current, setCurrent] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setDocs(await docApi.list({ q: dq || undefined, serviceId: serviceId || undefined }));
      setError('');
    } catch (e) {
      setError(errMsg(e));
    }
  }, [dq, serviceId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { serviceApi.list({ size: 200, sort: 'name,asc' }).then((p) => setServices(p.content)).catch(() => {}); }, []);
  useEffect(() => {
    if (!docId) { setCurrent(null); return; }
    docApi.get(docId).then(setCurrent).catch((e) => { setCurrent(null); toast.error(errMsg(e)); });
  }, [docId]); // eslint-disable-line react-hooks/exhaustive-deps

  const select = (id) => { const p = new URLSearchParams(params); p.set('doc', id); setParams(p); };
  const filterService = (v) => { const p = new URLSearchParams(); if (v) p.set('serviceId', v); setParams(p); };

  const openForm = (doc) => {
    setErrors({});
    setEditId(doc?.id ?? null);
    setForm(doc
      ? { title: doc.title, content: doc.content || '', type: doc.type, sourceUrl: doc.sourceUrl || '', serviceId: String(doc.service.id) }
      : { ...EMPTY, serviceId: serviceId || '' });
  };

  const save = async (e) => {
    e.preventDefault();
    const er = {};
    if (!form.title.trim()) er.title = 'Title is required.';
    if (!form.serviceId) er.serviceId = 'Choose a service.';
    setErrors(er);
    if (Object.keys(er).length) return;
    setSaving(true);
    try {
      const body = { ...form, serviceId: Number(form.serviceId) };
      const saved = editId ? await docApi.update(editId, body) : await docApi.create(body);
      toast.success(editId ? 'Document saved.' : 'Document created.');
      setForm(null);
      await load();
      select(saved.id);
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await docApi.remove(current.id);
      toast.success('Document deleted.');
      setDeleting(false);
      const p = new URLSearchParams(params); p.delete('doc'); setParams(p);
      load();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <>
      <div className="page-head">
        <div><h1>Documentation</h1><p>READMEs and API specs pulled from GitHub, plus your own guides.</p></div>
        {canEdit && <button className="btn btn-accent" onClick={() => openForm(null)}><i className="bi bi-plus-lg me-1" />Add document</button>}
      </div>
      <ErrorBanner message={error} onRetry={load} />

      <div className="row g-3">
        <div className="col-lg-4">
          <div className="panel">
            <div className="panel-body border-bottom d-grid gap-2">
              <input className="form-control" placeholder="Search documents" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search documents" />
              <select className="form-select" value={serviceId} onChange={(e) => filterService(e.target.value)} aria-label="Filter by service">
                <option value="">All services</option>
                {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="doc-list">
              {!docs ? <Loader /> : docs.length === 0 ? (
                <EmptyState icon="bi-journal" title="No documents found">Run a sync or add a document.</EmptyState>
              ) : docs.map((d) => (
                <button key={d.id} className={`doc-item ${String(d.id) === docId ? 'active' : ''}`} onClick={() => select(d.id)}>
                  <div className="d-flex justify-content-between gap-2"><span className="fw-medium">{d.title}</span><StatusBadge value={d.type} /></div>
                  <div className="small text-muted"><span className="mono">{d.serviceName}</span> · {timeAgo(d.updatedAt)}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="panel">
            {!current ? (
              <EmptyState icon="bi-file-text" title="Select a document">Pick one from the list to read it here.</EmptyState>
            ) : (
              <>
                <div className="panel-head">
                  <div>
                    <h2>{current.title}</h2>
                    <div className="small text-muted"><span className="mono">{current.service.name}</span> · updated {fmtDateTime(current.updatedAt)}</div>
                  </div>
                  <div className="d-flex gap-2">
                    {current.sourceUrl && <a className="btn btn-sm btn-light" href={current.sourceUrl} target="_blank" rel="noreferrer">Source</a>}
                    {canEdit && (
                      <>
                        <button className="btn btn-sm btn-light" onClick={() => openForm(current)}>Edit</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleting(true)}>Delete</button>
                      </>
                    )}
                  </div>
                </div>
                <div className="panel-body"><pre className="doc-body">{current.content || 'This document is empty.'}</pre></div>
              </>
            )}
          </div>
        </div>
      </div>

      <Modal show={!!form} onClose={() => setForm(null)} title={editId ? 'Edit document' : 'Add document'}
        footer={<>
          <button className="btn btn-light" onClick={() => setForm(null)}>Cancel</button>
          <button type="submit" form="doc-form" className="btn btn-accent" disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2" />}Save document
          </button>
        </>}>
        {form && (
          <form id="doc-form" className="row g-3" onSubmit={save} noValidate>
            <div className="col-md-8">
              <label className="form-label" htmlFor="d-title">Title</label>
              <input id="d-title" name="title" value={form.title} onChange={set} className={`form-control ${errors.title ? 'is-invalid' : ''}`} />
              {errors.title && <div className="invalid-feedback">{errors.title}</div>}
            </div>
            <div className="col-md-4">
              <label className="form-label" htmlFor="d-type">Type</label>
              <select id="d-type" name="type" value={form.type} onChange={set} className="form-select">
                <option value="GUIDE">Guide</option><option value="README">README</option><option value="API">API</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="d-service">Service</label>
              <select id="d-service" name="serviceId" value={form.serviceId} onChange={set} className={`form-select ${errors.serviceId ? 'is-invalid' : ''}`}>
                <option value="">Choose a service</option>
                {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {errors.serviceId && <div className="invalid-feedback">{errors.serviceId}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="d-src">Source URL (optional)</label>
              <input id="d-src" name="sourceUrl" value={form.sourceUrl} onChange={set} className="form-control" placeholder="https://" />
            </div>
            <div className="col-12">
              <label className="form-label" htmlFor="d-content">Content</label>
              <textarea id="d-content" name="content" rows="10" value={form.content} onChange={set} className="form-control mono" />
            </div>
          </form>
        )}
      </Modal>
      <ConfirmModal show={deleting} title="Delete document" message={`Delete "${current?.title}"?`} onClose={() => setDeleting(false)} onConfirm={remove} />
    </>
  );
}
