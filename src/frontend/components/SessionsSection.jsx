import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessions } from '../hooks/useSessions';
import { toast } from 'sonner';
import SessionsTable from './SessionsTable';
import Pagination from './Pagination';

const PAGE_SIZE = 10;

export default function SessionsSection({ onDeleteAll, onViewVideo, onViewLog, onDeleteSession }) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useSessions(page, PAGE_SIZE);

  const sessions = data?.sessions ?? [];
  const pagination = data?.pagination ?? { total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 };
  const totalPages = Math.max(1, pagination.totalPages ?? 1);

  useEffect(() => {
    if (isError) toast.error(t('toast.loadSessionsError'));
  }, [isError, t]);

  return (
    <section className="flex-1 p-6 overflow-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">{t('sessions.title')}</h2>
          <button
            type="button"
            onClick={() => onDeleteAll(sessions[0]?.sessionId)}
            className="px-4 py-2 rounded-lg text-white hover:bg-[#ff6b6b] transition-colors border border-[rgba(91,194,231,0.2)]"
          >
            {t('sessions.deleteAll')}
          </button>
        </div>

        <div className="bg-[#11111f] border border-[rgba(91,194,231,0.2)] rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-[#6b7280]">{t('sessions.loading')}</div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center text-[#6b7280]">{t('sessions.empty')}</div>
          ) : (
            <>
              <SessionsTable
                sessions={sessions}
                onViewVideo={onViewVideo}
                onViewLog={onViewLog}
                onDeleteSession={onDeleteSession}
              />
              <Pagination
                page={pagination.page ?? page}
                totalPages={totalPages}
                onPrev={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
