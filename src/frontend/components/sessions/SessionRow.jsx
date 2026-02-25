import ForceCloseButton from './ForceCloseButton';

function formatElapsed(seconds = 0) {
  const total = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(total / 60);
  const remainingSeconds = total % 60;
  return `${minutes}m ${String(remainingSeconds).padStart(2, '0')}s`;
}

export default function SessionRow({ row, onForceClose }) {
  return (
    <tr className="border-t border-[rgba(91,194,231,0.1)]">
      <td className="py-3 px-4 text-[#c0c5ce]">{row.connectionId || '—'}</td>
      <td className="py-3 px-4 text-[#c0c5ce] uppercase">{row.connectionType || '—'}</td>
      <td className="py-3 px-4 text-[#c0c5ce]">{formatElapsed(row.elapsedSeconds)}</td>
      <td className="py-3 px-4 text-right">
        <ForceCloseButton sessionId={row.sessionId} onForceClose={onForceClose} />
      </td>
    </tr>
  );
}
