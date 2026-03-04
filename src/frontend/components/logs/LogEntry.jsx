import LogLevelBadge from './LogLevelBadge';
// Función para formatear la marca de tiempo de un log en una cadena legible.
function formatTimestamp(timestamp) {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleString();
}

export default function LogEntry({ log }) {
  return (
    <div className="rounded border border-[rgba(91,194,231,0.15)] bg-[#0f1020] p-3">
      <div className="flex items-center justify-between gap-3">
        <LogLevelBadge level={log.level} />
        <span className="text-xs text-[#9ca3af]">{formatTimestamp(log.timestamp)}</span>
      </div>
      <p className="mt-2 text-sm text-[#e5e7eb] break-words">{log.message || '—'}</p>
    </div>
  );
}
