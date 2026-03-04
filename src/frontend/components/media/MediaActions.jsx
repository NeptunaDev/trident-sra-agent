export default function MediaActions({ t, onView, onViewLabel, onDelete }) {
  return (
    <div className="flex flex-wrap gap-2">
      {onView && (
        <button
          type="button"
          onClick={onView}
          className="px-2 py-1 text-sm text-white hover:text-[#5bc2e7] hover:bg-[#11111f] rounded border border-transparent hover:border-[rgba(91,194,231,0.2)]"
        >
          {onViewLabel}
        </button>
      )}
      <button
        type="button"
        onClick={onDelete}
        className="px-2 py-1 text-sm text-white hover:bg-[#ff6b6b] rounded"
      >
        {t('sessions.delete')}
      </button>
    </div>
  );
}
