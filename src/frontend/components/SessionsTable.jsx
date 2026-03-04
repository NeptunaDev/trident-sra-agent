import { useTranslation } from "react-i18next";
import { normalizeSession } from "../utils/format";
import SessionRow from "./SessionRow";

export default function SessionsTable({
  sessions,
  onViewVideo,
  onViewLog,
  onDeleteSession,
}) {
  const { t } = useTranslation();

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-[#0f0f1c] border-b border-[rgba(91,194,231,0.2)]">
          <th className="text-left py-3 px-4 text-[#c0c5ce] font-semibold">
            {t("sessions.connection")}
          </th>
          <th className="text-left py-3 px-4 text-[#c0c5ce] font-semibold">
            {t("sessions.sessionId")}
          </th>
          <th className="text-left py-3 px-4 text-[#c0c5ce] font-semibold">
            {t("sessions.createdAt")}
          </th>
          <th className="text-left py-3 px-4 text-[#c0c5ce] font-semibold">
            {t("sessions.video")}
          </th>
          <th className="text-left py-3 px-4 text-[#c0c5ce] font-semibold">
            {t("sessions.typescript")}
          </th>
          <th className="text-left py-3 px-4 text-[#c0c5ce] font-semibold">
            {t("sessions.actions")}
          </th>
        </tr>
      </thead>
      <tbody>
        {sessions.map((row) => {
          const session = normalizeSession(row);
          return (
            <SessionRow
              key={session.sessionId}
              session={session}
              onViewVideo={onViewVideo}
              onViewLog={onViewLog}
              onDeleteSession={onDeleteSession}
            />
          );
        })}
      </tbody>
    </table>
  );
}
