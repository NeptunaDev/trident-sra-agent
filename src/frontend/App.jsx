import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import Layout from './components/layout/Layout';
import AgentPorts from './components/dashboard/AgentPorts';
import GuacdStatus from './components/dashboard/GuacdStatus';
import SessionsCounter from './components/dashboard/SessionsCounter';
import ActiveSessionsTable from './components/sessions/ActiveSessionsTable';
import AlertItem from './components/alerts/AlertItem';
import AlertFilters from './components/alerts/AlertFilters';
import AlertsPanel from './components/alerts/AlertsPanel';
import LogFeed from './components/logs/LogFeed';
import RecordingsTable from './components/media/RecordingsTable';
import TypescriptTable from './components/media/TypescriptTable';
import VideoPlayer from './components/media/VideoPlayer';
import LogViewer from './components/media/LogViewer';
import ModalDeleteSession from './components/ModalDeleteSession';
import {
  cleanLogs,
  deleteSession,
  forceCloseSession,
} from './api/endpoints';
import { SESSION_QUERY_KEY, useSessions } from './hooks/useSessions';
import { ACTIVE_SESSIONS_QUERY_KEY, useActiveSessions } from './hooks/useActiveSessions';
import { useAgentStatus } from './hooks/useAgentStatus';
import { useAgentLogs } from './hooks/useAgentLogs';
import { useAlerts } from './hooks/useAlerts';

const VALID_PATHS = new Set(['/dashboard', '/logs', '/alerts', '/media', '/settings']);

function normalizeHashPath(hashValue) {
  const hash = String(hashValue || '').trim();
  const rawPath = hash.startsWith('#') ? hash.slice(1) : hash;
  const path = rawPath || '/dashboard';
  return VALID_PATHS.has(path) ? path : '/dashboard';
}

export default function App() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [currentPath, setCurrentPath] = useState(() => normalizeHashPath(window.location.hash));

  const [logsLevel, setLogsLevel] = useState('');
  const [logsSearch, setLogsSearch] = useState('');
  const [alertsLevel, setAlertsLevel] = useState('ALL');
  const [alertsDateRange, setAlertsDateRange] = useState('ALL');
  const [alertsStatus, setAlertsStatus] = useState('ALL');

  const [videoSessionId, setVideoSessionId] = useState('');
  const [logSessionId, setLogSessionId] = useState('');
  const [deleteSessionId, setDeleteSessionId] = useState('');

  const { data: status } = useAgentStatus();
  const { data: activeData } = useActiveSessions();
  const { data: logs = [], isLoading: logsLoading, isError: logsError, refetch: refetchLogs } = useAgentLogs({
    level: logsLevel,
    search: logsSearch,
    limit: 200,
  });
  const {
    allAlerts,
    alerts,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useAlerts({
    level: alertsLevel,
    dateRange: alertsDateRange,
    status: alertsStatus,
    limit: 200,
  });

  const { data: sessionsData, isLoading: sessionsLoading, isError: sessionsError } = useSessions(1, 50);

  const activeRows = activeData?.active || [];
  const activeCount = Number(activeData?.count || 0);
  const activeLimit = Number(activeData?.limit || 5);
  const recentAlerts = allAlerts.slice(0, 5);

  const allSessions = Array.isArray(sessionsData?.sessions) ? sessionsData.sessions : [];
  const activeSessionIds = new Set(activeRows.map((row) => String(row?.sessionId || '').trim()).filter(Boolean));
  const completedSessions = allSessions.filter((row) => {
    const sessionId = String(row?.sessionId || row?.session_id || '').trim();
    return sessionId && !activeSessionIds.has(sessionId);
  });

  const recordingsRows = completedSessions.filter((row) => (row.videoPath || row.video_path || '').toString().trim().length > 0);
  const typescriptRows = completedSessions.filter((row) => (row.typescriptPath || row.typescript_path || '').toString().trim().length > 0);

  useEffect(() => {
    const onHashChange = () => {
      const path = normalizeHashPath(window.location.hash);
      setCurrentPath(path);
      if (window.location.hash !== `#${path}`) {
        window.location.hash = `#${path}`;
      }
    };

    onHashChange();
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  function navigate(path) {
    const nextPath = normalizeHashPath(`#${path}`);
    if (nextPath === currentPath) return;
    window.location.hash = `#${nextPath}`;
    setCurrentPath(nextPath);
  }

  async function handleForceClose(sessionId) {
    try {
      await forceCloseSession(sessionId);
      queryClient.invalidateQueries({ queryKey: ACTIVE_SESSIONS_QUERY_KEY });
      toast.success('Sesión cerrada');
    } catch {
      toast.error('No se pudo cerrar la sesión');
    }
  }

  async function handleClearLogs() {
    try {
      await cleanLogs();
      await refetchLogs();
      toast.success(t('logs.clearSuccess'));
    } catch {
      toast.error(t('logs.clearError'));
    }
  }

  async function handleDeleteSessionSuccess() {
    setDeleteSessionId('');
    toast.success(t('toast.deleteSessionSuccess'));
    queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
  }

  function renderDashboardView() {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AgentPorts />
          <GuacdStatus guacdOk={!!status?.guacdOk} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-4">
            <SessionsCounter count={activeCount} limit={activeLimit} />
            <ActiveSessionsTable rows={activeRows} onForceClose={handleForceClose} />
          </div>

          <div className="bg-[#11111f] border border-[rgba(91,194,231,0.2)] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold">{t('alerts.recentTitle')}</h2>
              <button
                type="button"
                onClick={() => navigate('/alerts')}
                className="text-[#5bc2e7] text-sm"
              >
                {t('alerts.viewAll')}
              </button>
            </div>

            <div className="space-y-2">
              {recentAlerts.length === 0 ? (
                <p className="text-[#6b7280] text-sm">{t('alerts.recentEmpty')}</p>
              ) : (
                recentAlerts.map((alert) => <AlertItem key={alert.id} alert={alert} />)
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderLogsView() {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-[#11111f] border border-[rgba(91,194,231,0.2)] rounded-lg p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-white font-semibold">{t('logs.title')}</h2>
            <button
              type="button"
              onClick={handleClearLogs}
              className="px-3 py-1.5 rounded text-sm font-medium text-[#c0c5ce] hover:text-[#5bc2e7] hover:bg-[#0f1020] border border-[rgba(91,194,231,0.2)]"
            >
              {t('logs.clearButton')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={logsLevel}
              onChange={(event) => setLogsLevel(event.target.value)}
              className="bg-[#0f1020] border border-[rgba(91,194,231,0.2)] rounded px-3 py-2 text-sm text-[#e5e7eb]"
            >
              <option value="">{t('logs.levelAll')}</option>
              <option value="INFO">{t('logs.levelInfo')}</option>
              <option value="WARN">{t('logs.levelWarn')}</option>
              <option value="ERROR">{t('logs.levelError')}</option>
            </select>

            <input
              type="text"
              value={logsSearch}
              onChange={(event) => setLogsSearch(event.target.value)}
              placeholder={t('logs.searchPlaceholder')}
              className="md:col-span-2 bg-[#0f1020] border border-[rgba(91,194,231,0.2)] rounded px-3 py-2 text-sm text-[#e5e7eb] placeholder:text-[#6b7280]"
            />
          </div>

          <LogFeed
            logs={logs}
            isLoading={logsLoading}
            isError={logsError}
            loadingText={t('logs.loading')}
            errorText={t('logs.error')}
            emptyText={t('logs.empty')}
          />
        </div>
      </div>
    );
  }

  function renderAlertsView() {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="bg-[#11111f] border border-[rgba(91,194,231,0.2)] rounded-lg p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-white font-semibold">{t('alerts.title')}</h2>
            <button
              type="button"
              onClick={markAllAsRead}
              className="px-3 py-1.5 rounded text-sm font-medium text-[#c0c5ce] hover:text-[#5bc2e7] hover:bg-[#0f1020] border border-[rgba(91,194,231,0.2)]"
            >
              {t('alerts.markAllRead')}
            </button>
          </div>

          <AlertFilters
            t={t}
            level={alertsLevel}
            dateRange={alertsDateRange}
            status={alertsStatus}
            onLevelChange={setAlertsLevel}
            onDateRangeChange={setAlertsDateRange}
            onStatusChange={setAlertsStatus}
          />

          <AlertsPanel
            alerts={alerts}
            onMarkAsRead={markAsRead}
            emptyText={t('alerts.empty')}
            markReadText={t('alerts.markRead')}
          />
        </div>
      </div>
    );
  }

  function renderMediaView() {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <h2 className="text-white font-semibold">{t('media.title')}</h2>

        {sessionsLoading && <p className="text-sm text-[#9ca3af]">{t('sessions.loading')}</p>}
        {sessionsError && <p className="text-sm text-[#ff6b6b]">{t('toast.loadSessionsError')}</p>}

        {!sessionsLoading && !sessionsError && (
          <>
            <RecordingsTable rows={recordingsRows} onViewVideo={setVideoSessionId} onDelete={setDeleteSessionId} t={t} />
            <TypescriptTable rows={typescriptRows} onViewLog={setLogSessionId} onDelete={setDeleteSessionId} t={t} />
          </>
        )}
      </div>
    );
  }

  function renderSettingsView() {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-[#11111f] border border-[rgba(91,194,231,0.2)] rounded-lg p-6">
          <h2 className="text-white font-semibold mb-2">{t('settings.title')}</h2>
          <p className="text-[#9ca3af]">{t('settings.placeholder')}</p>
        </div>
      </div>
    );
  }

  function renderRoute() {
    if (currentPath === '/dashboard') return renderDashboardView();
    if (currentPath === '/logs') return renderLogsView();
    if (currentPath === '/alerts') return renderAlertsView();
    if (currentPath === '/media') return renderMediaView();
    return renderSettingsView();
  }

  return (
    <>
      <Layout
        currentPath={currentPath}
        onNavigate={navigate}
        unreadAlerts={unreadCount}
        guacdOk={!!status?.guacdOk}
        t={t}
      >
        {renderRoute()}
      </Layout>

      <VideoPlayer sessionId={videoSessionId} open={!!videoSessionId} onClose={() => setVideoSessionId('')} />
      <LogViewer open={!!logSessionId} sessionId={logSessionId} onClose={() => setLogSessionId('')} />

      <ModalDeleteSession
        sessionId={deleteSessionId}
        open={!!deleteSessionId}
        onClose={() => setDeleteSessionId('')}
        onSuccess={handleDeleteSessionSuccess}
        onError={(errorMessage) => toast.error(errorMessage || t('toast.deleteSessionError'))}
      />
    </>
  );
}
