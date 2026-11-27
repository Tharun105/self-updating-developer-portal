import StatusBadge from './StatusBadge.jsx';
import { EmptyState } from './Loader.jsx';
import { fmtDateTime } from '../utils/format.js';

export default function SyncHistoryTable({ rows }) {
  if (!rows?.length) {
    return <EmptyState icon="bi-arrow-repeat" title="No synchronizations yet">Run a manual sync to populate the catalogue.</EmptyState>;
  }
  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead>
          <tr><th>Started</th><th>Type</th><th>Status</th><th className="text-end">Repos</th>
            <th className="text-end">New</th><th className="text-end">Updated</th><th>By</th><th>Details</th></tr>
        </thead>
        <tbody>
          {rows.map((h) => (
            <tr key={h.id}>
              <td className="text-nowrap">{fmtDateTime(h.startedAt)}</td>
              <td><StatusBadge value={h.type} /></td>
              <td><StatusBadge value={h.status} /></td>
              <td className="text-end">{h.reposFound}</td>
              <td className="text-end">{h.servicesCreated}</td>
              <td className="text-end">{h.servicesUpdated}</td>
              <td>{h.triggeredBy}</td>
              <td className="small text-muted sync-msg" title={h.message}>{h.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
