// Backend sends UTC timestamps without a zone suffix; treat them as UTC.
const parse = (d) => new Date(/[zZ]$|[+-]\d\d:?\d\d$/.test(d) ? d : `${d}Z`);

export const fmtDate = (d) =>
  d ? parse(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

export const fmtDateTime = (d) =>
  d
    ? parse(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

export const timeAgo = (d) => {
  if (!d) return '—';
  const s = Math.max(0, (Date.now() - parse(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} d ago`;
  return fmtDate(d);
};

export const errMsg = (e) =>
  e?.response?.data?.message ||
  (e?.code === 'ERR_NETWORK' ? 'Cannot reach the server. Is the backend running on port 8080?' : e?.message) ||
  'Something went wrong.';

export const fieldErrors = (e) => e?.response?.data?.errors || {};
