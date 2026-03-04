export default function StatusCard({ icon = '●', label, value, color = '#5bc2e7' }) {
  return (
    <div className="bg-[#11111f] border border-[rgba(91,194,231,0.2)] rounded-lg p-4">
      <div className="flex items-center gap-2">
        <span style={{ color }} className="text-sm">{icon}</span>
        <p className="text-[#c0c5ce] text-sm">{label}</p>
      </div>
      <p className="text-white text-xl font-semibold mt-2" style={{ color }}>{value}</p>
    </div>
  );
}
