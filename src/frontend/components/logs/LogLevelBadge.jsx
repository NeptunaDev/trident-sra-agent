const STYLES_BY_LEVEL = {
  INFO: 'bg-[#11111f] text-[#9ca3af] border border-[#9ca3af]/30',
  WARN: 'bg-[#11111f] text-[#ffc107] border border-[#ffc107]/30',
  ERROR: 'bg-[#11111f] text-[#ff6b6b] border border-[#ff6b6b]/30',
};

export default function LogLevelBadge({ level }) {
  const normalized = String(level || 'INFO').toUpperCase();
  const className = STYLES_BY_LEVEL[normalized] || STYLES_BY_LEVEL.INFO;

  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${className}`}>
      {normalized}
    </span>
  );
}
