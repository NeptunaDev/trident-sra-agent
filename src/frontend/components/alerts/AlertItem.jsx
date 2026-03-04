export default function AlertItem({ alert, onMarkAsRead, markReadText = 'Marcar como vista' }) {
  const level = String(alert.level || 'WARN').toUpperCase();
  const isUnread = !alert.isRead;
  const border = level === 'ERROR' ? 'border-[#ff6b6b]/40' : 'border-[#ffc107]/40';
  const badge = level === 'ERROR' ? 'bg-[#ff6b6b]/20 text-[#ff6b6b]' : 'bg-[#ffc107]/20 text-[#ffc107]';
  const icon = level === 'ERROR';

  return (
    <div className={`rounded-lg border ${border} ${isUnread ? 'bg-[rgba(255,107,107,0.07)]' : 'bg-[#11111f]'} p-3`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm" aria-hidden>{icon}</span>
        <span className={`text-xs px-2 py-0.5 rounded ${badge}`}>{level}</span>
        <span className="text-xs text-[#6b7280]">{new Date(alert.timestamp || Date.now()).toLocaleString()}</span>
        {!alert.isRead && (
          <button
            type="button"
            onClick={() => onMarkAsRead?.(alert.id)}
            className="ml-auto text-xs text-[#5bc2e7] hover:underline"
          >
            {markReadText}
          </button>
        )}
      </div>
      <p className="text-[#c0c5ce] text-sm">{alert.message || '—'}</p>
    </div>
  );
}
