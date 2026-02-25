import LogEntry from './LogEntry';

export default function LogFeed({ logs = [], emptyText, loadingText, errorText, isLoading = false, isError = false }) {
  if (isLoading) return <p className="text-sm text-[#9ca3af]">{loadingText}</p>;
  if (isError) return <p className="text-sm text-[#ff6b6b]">{errorText}</p>;
  if (!logs.length) return <p className="text-sm text-[#9ca3af]">{emptyText}</p>;

  return (
    <div className="max-h-[460px] overflow-auto space-y-2 pr-1">
      {logs.map((log) => (
        <LogEntry key={log.id} log={log} />
      ))}
    </div>
  );
}
