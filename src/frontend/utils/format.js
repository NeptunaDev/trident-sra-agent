const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function formatSessionDate(isoString) {
  const str = (isoString || '').trim();
  if (!str) return { display: '—', title: '' };
  try {
    const d = new Date(str);
    if (Number.isNaN(d.getTime())) return { display: str, title: str };
    const day = d.getDate();
    const month = MONTHS_SHORT[d.getMonth()];
    const year = d.getFullYear();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    const ms = String(d.getMilliseconds()).padStart(3, '0');
    return {
      display: `${day} ${month} ${year}`,
      title: `${day} ${month} ${year}, ${h}:${m}:${s}.${ms}`,
    };
  } catch {
    return { display: str, title: str };
  }
}

export function shortenSessionId(sessionId) {
  const s = (sessionId || '').trim();
  if (!s) return { short: '—', full: '' };
  const parts = s.split('-');
  const short = parts.length >= 2 ? parts.slice(0, 2).join('-') : s;
  return { short, full: s };
}

export function cellWithTitle(text, maxLen = 40) {
  const str = String(text || '').trim();
  if (!str) return { short: '—', title: '' };
  return {
    short: str.length > maxLen ? str.slice(0, maxLen) + '…' : str,
    title: str,
  };
}

export function normalizeSession(row) {
  return {
    connectionName: row.connectionName ?? row.connection_name ?? '',
    sessionId: row.sessionId ?? row.session_id ?? '',
    videoPath: row.videoPath ?? row.video_path ?? '',
    typescriptPath: row.typescriptPath ?? row.typescript_path ?? '',
    createdAt: row.createdAt ?? row.created_at ?? '',
  };
}
