import { useTranslation } from 'react-i18next';

export default function Pagination({ page, totalPages, onPrev, onNext }) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between py-3 px-4 border-t border-neptuna/8 bg-[#11111f]">
      <button
        type="button"
        onClick={onPrev}
        disabled={page <= 1}
        className="px-3 py-1.5 text-sm text-[#c0c5ce] hover:text-[#5bc2e7] hover:bg-[#1a1a2e] rounded disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
      >
        {t('sessions.prev')}
      </button>
      <span className="text-sm text-[#c0c5ce]">
        {t('sessions.page', { current: page, total: totalPages })}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={page >= totalPages}
        className="px-3 py-1.5 text-sm text-[#c0c5ce] hover:text-[#5bc2e7] hover:bg-[#1a1a2e] rounded disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
      >
        {t('sessions.next')}
      </button>
    </div>
  );
}
