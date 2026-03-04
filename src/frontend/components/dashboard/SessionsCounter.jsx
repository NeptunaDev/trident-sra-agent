export default function SessionsCounter({ count = 0, limit = 1 }) {
  const current = Number(count || 0);
  const max = Math.max(1, Number(limit || 1));
  const percentage = Math.min(100, Math.round((current / max) * 100));

  return (
    <div className="bg-[#11111f] border border-[rgba(91,194,231,0.2)] rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-semibold">Sesiones activas</h3>
        <span className="text-[#c0c5ce] text-sm">{current} / {max}</span>
      </div>
      <div className="w-full h-2 rounded bg-[#0f1020] overflow-hidden">
        <div className="h-2 bg-[#5bc2e7]" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
