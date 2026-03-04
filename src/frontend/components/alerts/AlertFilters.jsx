export default function AlertFilters({ t, level = 'ALL', dateRange = 'ALL', status = 'ALL', onLevelChange, onDateRangeChange, onStatusChange }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-[#9ca3af]">{t('alerts.filters.level')}</span>
        <select
          value={level}
          onChange={(event) => onLevelChange?.(event.target.value)}
          className="bg-[#0f1020] border border-[rgba(91,194,231,0.2)] rounded px-3 py-2 text-sm text-[#e5e7eb]"
        >
          <option value="ALL">{t('alerts.filters.levelAll')}</option>
          <option value="WARN">WARN</option>
          <option value="ERROR">ERROR</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-[#9ca3af]">{t('alerts.filters.dateRange')}</span>
        <select
          value={dateRange}
          onChange={(event) => onDateRangeChange?.(event.target.value)}
          className="bg-[#0f1020] border border-[rgba(91,194,231,0.2)] rounded px-3 py-2 text-sm text-[#e5e7eb]"
        >
          <option value="ALL">{t('alerts.filters.dateAll')}</option>
          <option value="24H">{t('alerts.filters.date24h')}</option>
          <option value="7D">{t('alerts.filters.date7d')}</option>
          <option value="30D">{t('alerts.filters.date30d')}</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-[#9ca3af]">{t('alerts.filters.status')}</span>
        <select
          value={status}
          onChange={(event) => onStatusChange?.(event.target.value)}
          className="bg-[#0f1020] border border-[rgba(91,194,231,0.2)] rounded px-3 py-2 text-sm text-[#e5e7eb]"
        >
          <option value="ALL">{t('alerts.filters.statusAll')}</option>
          <option value="UNREAD">{t('alerts.filters.statusUnread')}</option>
          <option value="READ">{t('alerts.filters.statusRead')}</option>
        </select>
      </label>
    </div>
  );
}
