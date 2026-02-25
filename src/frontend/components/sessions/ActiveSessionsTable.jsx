import SessionRow from './SessionRow';

export default function ActiveSessionsTable({ rows = [], onForceClose }) {
  return (
    <div className="bg-[#11111f] border border-[rgba(91,194,231,0.2)] rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[#0f0f1c]">
          <tr>
            <th className="text-left py-3 px-4 text-[#c0c5ce]">Conexión</th>
            <th className="text-left py-3 px-4 text-[#c0c5ce]">Protocolo</th>
            <th className="text-left py-3 px-4 text-[#c0c5ce]">Transcurrido</th>
            <th className="text-right py-3 px-4 text-[#c0c5ce]">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-8 text-center text-[#6b7280]">Sin sesiones activas</td>
            </tr>
          ) : rows.map((row) => (
            <SessionRow key={row.sessionId} row={row} onForceClose={onForceClose} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
