import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg, fieldErrors } from '../utils/format.js';

export default function LoginPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    const er = {};
    if (!form.username.trim()) er.username = 'Enter your username.';
    if (!form.password) er.password = 'Enter your password.';
    if (mode === 'register') {
      if (form.username.trim().length < 3) er.username = 'Username needs at least 3 characters.';
      if (!/^\S+@\S+\.\S+$/.test(form.email)) er.email = 'Enter a valid email address.';
      if (form.password.length < 6) er.password = 'Password needs at least 6 characters.';
    }
    return er;
  };

  const submit = async (e) => {
    e.preventDefault();
    const er = validate();
    setErrors(er);
    setError('');
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      if (mode === 'login') await login({ username: form.username.trim(), password: form.password });
      else await register({ username: form.username.trim(), email: form.email.trim(), password: form.password });
      navigate('/', { replace: true });
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const input = (name, label, type = 'text', autoComplete) => (
    <div className="mb-3">
      <label className="form-label" htmlFor={`f-${name}`}>{label}</label>
      <input id={`f-${name}`} name={name} type={type} value={form[name]} onChange={change}
        autoComplete={autoComplete} className={`form-control ${errors[name] ? 'is-invalid' : ''}`} />
      {errors[name] && <div className="invalid-feedback">{errors[name]}</div>}
    </div>
  );

  return (
    <div className="login-wrap">
      <section className="login-hero">
        <h1>Your service catalogue, always up to date.</h1>
        <p className="mt-3 mb-0" style={{ maxWidth: '44ch' }}>
          DevPortal finds repositories on GitHub, keeps their metadata and documentation in sync, and shows which services are alive.
        </p>
        <div className="flow">
          <div className="flow-step"><i className="bi bi-github" /> Repositories discovered from GitHub</div>
          <div className="flow-step"><i className="bi bi-arrow-repeat" /> Metadata synced on a schedule</div>
          <div className="flow-step"><i className="bi bi-journal-text" /> READMEs and API specs kept current</div>
        </div>
      </section>
      <section className="login-form">
        <form className="login-card" onSubmit={submit} noValidate>
          <h2 className="h4 mb-1">{mode === 'login' ? 'Sign in' : 'Create an account'}</h2>
          <p className="text-muted mb-4">
            {mode === 'login' ? 'Use your portal credentials.' : 'New accounts start with read-only access.'}
          </p>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          {input('username', 'Username', 'text', 'username')}
          {mode === 'register' && input('email', 'Email', 'email', 'email')}
          {input('password', 'Password', 'password', mode === 'login' ? 'current-password' : 'new-password')}
          <button className="btn btn-accent w-100" disabled={busy}>
            {busy && <span className="spinner-border spinner-border-sm me-2" />}
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
          <div className="text-center mt-3 small">
            {mode === 'login' ? 'No account yet?' : 'Already registered?'}{' '}
            <button type="button" className="btn btn-link btn-sm p-0 align-baseline"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrors({}); setError(''); }}>
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </div>
          {mode === 'login' && (
            <div className="mt-4 p-3 rounded small bg-white border">
              <div className="fw-semibold mb-1">Demo accounts</div>
              <div><code>admin</code> / <code>admin123</code> (full access)</div>
              <div><code>developer</code> / <code>dev123</code> (manage services)</div>
              <div><code>viewer</code> / <code>view123</code> (read only)</div>
            </div>
          )}
        </form>
      </section>
    </div>
  );
}
