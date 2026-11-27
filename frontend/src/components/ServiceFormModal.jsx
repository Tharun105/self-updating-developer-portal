import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import { serviceApi } from '../api/api';
import { useToast } from '../context/ToastContext.jsx';
import { errMsg, fieldErrors } from '../utils/format.js';

const EMPTY = { name: '', description: '', owner: '', language: '', repoUrl: '', apiDocUrl: '', version: '', status: 'ACTIVE' };
const URL_RE = /^https?:\/\/.+/i;

export default function ServiceFormModal({ show, service, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!show) return;
    const next = { ...EMPTY };
    if (service) Object.keys(EMPTY).forEach((k) => { next[k] = service[k] ?? ''; });
    setForm(next);
    setErrors({});
  }, [show, service]);

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    const er = {};
    if (!form.name.trim()) er.name = 'Name is required.';
    ['repoUrl', 'apiDocUrl'].forEach((k) => {
      if (form[k] && !URL_RE.test(form[k])) er[k] = 'Must start with http:// or https://';
    });
    return er;
  };

  const submit = async (e) => {
    e.preventDefault();
    const er = validate();
    setErrors(er);
    if (Object.keys(er).length) return;
    setSaving(true);
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]));
      const saved = service ? await serviceApi.update(service.id, payload) : await serviceApi.create(payload);
      toast.success(service ? 'Service saved.' : 'Service created.');
      onSaved(saved);
      onClose();
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const field = (name, label, props = {}) => (
    <div className={props.col || 'col-md-6'}>
      <label className="form-label" htmlFor={`svc-${name}`}>{label}</label>
      <input id={`svc-${name}`} name={name} value={form[name]} onChange={change}
        className={`form-control ${errors[name] ? 'is-invalid' : ''}`} placeholder={props.placeholder} />
      {errors[name] && <div className="invalid-feedback">{errors[name]}</div>}
    </div>
  );

  return (
    <Modal show={show} onClose={onClose} title={service ? `Edit ${service.name}` : 'Add service'}
      footer={
        <>
          <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
          <button type="submit" form="service-form" className="btn btn-accent" disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2" />}Save service
          </button>
        </>
      }>
      <form id="service-form" className="row g-3" onSubmit={submit} noValidate>
        {field('name', 'Service name', { placeholder: 'payment-api' })}
        {field('owner', 'Owner or team', { placeholder: 'Payments Team' })}
        <div className="col-12">
          <label className="form-label" htmlFor="svc-description">Description</label>
          <textarea id="svc-description" name="description" rows="3" value={form.description} onChange={change}
            className={`form-control ${errors.description ? 'is-invalid' : ''}`} />
          {errors.description && <div className="invalid-feedback">{errors.description}</div>}
        </div>
        {field('language', 'Language', { col: 'col-md-4', placeholder: 'Java' })}
        {field('version', 'Version', { col: 'col-md-4', placeholder: '1.0.0' })}
        <div className="col-md-4">
          <label className="form-label" htmlFor="svc-status">Status</label>
          <select id="svc-status" name="status" value={form.status} onChange={change} className="form-select">
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
        {field('repoUrl', 'Repository URL', { col: 'col-12', placeholder: 'https://github.com/org/repo' })}
        {field('apiDocUrl', 'API specification URL (OpenAPI JSON/YAML, refreshed on every sync)', { col: 'col-12', placeholder: 'https://example.com/v3/api-docs' })}
      </form>
    </Modal>
  );
}
