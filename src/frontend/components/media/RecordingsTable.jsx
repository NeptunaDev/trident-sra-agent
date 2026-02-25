import { useState } from 'react';
import Pagination from '../Pagination';
import MediaActions from './MediaActions';
import { formatSessionDate, normalizeSession, shortenSessionId } from '../../utils/format';

const PAGE_SIZE = 5;

export default function RecordingsTable({ rows = [], onViewVideo, onDelete, t }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="bg-[#11111f] border border-[rgba(91,194,231,0.2)] rounded-lg overflow-hidden">
      <h3 className="px-4 py-3 border-b border-[rgba(91,194,231,0.2)] text-white font-semibold">{t('media.recordingsTitle')}</h3>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#0f0f1c] border-b border-[rgba(91,194,231,0.2)]">
            <th className="text-left py-3 px-4 text-[#c0c5ce] font-semibold">{t('sessions.sessionId')}</th>
            <th className="text-left py-3 px-4 text-[#c0c5ce] font-semibold">{t('sessions.connection')}</th>
            <th className="text-left py-3 px-4 text-[#c0c5ce] font-semibold">{t('media.protocol')}</th>
            <th className="text-left py-3 px-4 text-[#c0c5ce] font-semibold">{t('sessions.createdAt')}</th>
            <th className="text-left py-3 px-4 text-[#c0c5ce] font-semibold">{t('media.duration')}</th>
            <th className="text-left py-3 px-4 text-[#c0c5ce] font-semibold">{t('sessions.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {pagedRows.map((row) => {
            const session = normalizeSession(row);
            const idInfo = shortenSessionId(session.sessionId);
            const dateInfo = formatSessionDate(session.createdAt);
            const protocol = String(session.connectionName || '').includes('rdp') ? 'RDP' : 'VNC';

            return (
              <tr key={session.sessionId} className="border-b border-neptuna/8 hover:bg-[#1a1a2e] transition-colors">
                <td className="py-3 px-4 text-[#c0c5ce]"><code>{idInfo.short}</code></td>
                <td className="py-3 px-4 text-[#c0c5ce]">{session.connectionName || '—'}</td>
                <td className="py-3 px-4 text-[#c0c5ce]">{protocol}</td>
                <td className="py-3 px-4 text-[#c0c5ce]">{dateInfo.display}</td>
                <td className="py-3 px-4 text-[#c0c5ce]">—</td>
                <td className="py-3 px-4">
                  <MediaActions
                    t={t}
                    onView={() => onViewVideo(session.sessionId)}
                    onViewLabel={t('media.view')}
                    onDelete={() => onDelete(session.sessionId)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && <p className="p-4 text-sm text-[#9ca3af]">{t('media.emptyRecordings')}</p>}
      {rows.length > 0 && (
        <Pagination
          page={safePage}
          totalPages={totalPages}
          onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
          onNext={() => setPage((prev) => Math.min(totalPages, prev + 1))}
        />
      )}
    </div>
  );
}
