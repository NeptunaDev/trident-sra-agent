import AlertItem from './AlertItem';

export default function AlertsPanel({ alerts = [], onMarkAsRead, emptyText, markReadText }) {
  if (!alerts.length) return <p className="text-sm text-[#9ca3af]">{emptyText}</p>;

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <AlertItem
          key={alert.id}
          alert={alert}
          onMarkAsRead={onMarkAsRead}
          markReadText={markReadText}
        />
      ))}
    </div>
  );
}
