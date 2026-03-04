export default function AlertsBadge({ count = 0 }) {
  if (!count) return null;

  return (
    <span className="min-w-5 h-5 px-1 rounded-full bg-[#ff6b6b]/20 text-[#ff6b6b] text-xs inline-flex items-center justify-center">
      {count}
    </span>
  );
}
