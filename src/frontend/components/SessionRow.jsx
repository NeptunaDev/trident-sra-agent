import { useTranslation } from "react-i18next";
import { TooltipAnchor } from "./Tooltip";
import {
  formatSessionDate,
  shortenSessionId,
  cellWithTitle,
} from "../utils/format";

export default function SessionRow({
  session,
  onViewVideo,
  onViewLog,
  onDeleteSession,
}) {
  const { t } = useTranslation();
  const sessionIdInfo = shortenSessionId(session.sessionId);
  const dateInfo = formatSessionDate(session.createdAt);
  const videoInfo = cellWithTitle(session.videoPath);
  const typescriptInfo = cellWithTitle(session.typescriptPath);
  const hasVideo = (session.videoPath || "").trim().length > 0;
  const hasText = (session.typescriptPath || "").trim().length > 0;

  return (
    <tr
      className="border-b border-neptuna/8 hover:bg-[#1a1a2e] transition-colors"
      data-session-id={session.sessionId}
    >
      <td className="py-3 px-4 text-[#c0c5ce]">
        {session.connectionName || "—"}
      </td>
      <td className="py-3 px-4">
        <TooltipAnchor text={sessionIdInfo.full} className="cursor-default">
          <code className="text-[#c0c5ce]">{sessionIdInfo.short}</code>
        </TooltipAnchor>
      </td>
      <td className="py-3 px-4">
        <TooltipAnchor text={dateInfo.title} className="cursor-default">
          <span className="text-[#c0c5ce]">{dateInfo.display}</span>
        </TooltipAnchor>
      </td>
      <td className="py-3 px-4">
        <TooltipAnchor text={videoInfo.title} className="cursor-default">
          <span className="text-[#c0c5ce]">
            {videoInfo.short === "—" ? "—" : "Sí"}
          </span>
        </TooltipAnchor>
      </td>
      <td className="py-3 px-4">
        <TooltipAnchor text={typescriptInfo.title} className="cursor-default">
          <span className="text-[#c0c5ce]">
            {typescriptInfo.short === "—" ? "—" : "Sí"}
          </span>
        </TooltipAnchor>
      </td>
      <td className="py-3 px-4">
        <div className="flex flex-wrap gap-2">
          {hasVideo && (
            <button
              type="button"
              onClick={() => onViewVideo(session.sessionId)}
              className="px-2 py-1 text-sm text-white hover:text-[#5bc2e7] hover:bg-[#11111f] rounded border border-transparent hover:border-[rgba(91,194,231,0.2)]"
            >
              {t("sessions.viewVideo")}
            </button>
          )}
          {hasText && (
            <button
              type="button"
              onClick={() => onViewLog(session.sessionId)}
              className="px-2 py-1 text-sm text-white hover:text-[#5bc2e7] hover:bg-[#11111f] rounded border border-transparent hover:border-[rgba(91,194,231,0.2)]"
            >
              {t("sessions.viewText")}
            </button>
          )}
          <button
            type="button"
            onClick={() => onDeleteSession(session.sessionId)}
            className="px-2 py-1 text-sm text-white hover:bg-[#ff6b6b] hover:text-white rounded"
          >
            {t("sessions.delete")}
          </button>
        </div>
      </td>
    </tr>
  );
}
