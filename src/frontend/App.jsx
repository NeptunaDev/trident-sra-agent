import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import Layout from './components/Layout';
import Header from './components/Header';
import ProtocolButtons from './components/ProtocolButtons';
import RemoteDisplay from './components/RemoteDisplay';
import SessionsSection from './components/SessionsSection';
import ModalVideo from './components/ModalVideo';
import ModalDeleteAll from './components/ModalDeleteAll';
import ModalDeleteSession from './components/ModalDeleteSession';
import { fetchToken, getViewLogUrl } from './api/endpoints';
import { SESSION_QUERY_KEY } from './hooks/useSessions';

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export default function App() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [token, setToken] = useState(null);
  const [videoModalSessionId, setVideoModalSessionId] = useState(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteAllFirstSessionId, setDeleteAllFirstSessionId] = useState(null);
  const [deleteSessionId, setDeleteSessionId] = useState(null);

  const handleConnect = async (connection) => {
    try {
      const { token: newToken } = await fetchToken(connection);
      setToken(newToken);
      setConnected(true);
      toast.success(t('toast.connected'));
    } catch (err) {
      toast.error(t('toast.connectError'));
    }
  };

  const handleDisconnect = () => {
    setToken(null);
    setConnected(false);
    toast.info(t('toast.disconnected'));
    queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
  };

  const handleViewLog = useCallback(
    async (sessionId) => {
      try {
        const url = getViewLogUrl(sessionId);
        const res = await fetch(url);
        const text = await res.text();
        const popup = window.open('', '_blank', 'width=800,height=560,scrollbars=yes,resizable=yes');
        if (!popup) return;
        const escaped = escapeHtml(text) || '(vacío)';
        const lineCount = escaped.split('\n').length;
        const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');
        popup.document.write(
          `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Typescript ${escapeHtml(sessionId)}</title>
          <style>*{box-sizing:border-box;}body{margin:0;background:#0f172a;color:#e2e8f0;font:13px/1.5 "SF Mono",Monaco,Consolas,monospace;}
          .log-header{padding:0.5rem 1rem;background:#1e293b;border-bottom:1px solid #334155;color:#94a3b8;}
          .log-wrap{display:flex;overflow:auto;min-height:calc(100vh - 36px);}
          .line-nums{padding:0.75rem 0.5rem;background:#1e293b;color:#64748b;text-align:right;user-select:none;border-right:1px solid #334155;}
          .log-content{padding:0.75rem 1rem;white-space:pre-wrap;word-break:break-all;flex:1;}</style></head>
          <body><div class="log-header">Session ${escapeHtml(sessionId)} — Typescript log</div>
          <div class="log-wrap"><pre class="line-nums">${escapeHtml(lineNumbers)}</pre><pre class="log-content">${escaped}</pre></div></body></html>`
        );
        popup.document.close();
      } catch {
        toast.error(t('toast.logLoadError'));
      }
    },
    [t]
  );

  return (
    <Layout>
      <Header connected={connected} onDisconnect={handleDisconnect} />
      {connected && token ? (
        <RemoteDisplay token={token} onDisconnect={handleDisconnect} onError={() => toast.error(t('toast.connectError'))} />
      ) : (
        <>
          <ProtocolButtons onConnect={handleConnect} />
          <SessionsSection
            onDeleteAll={(firstSessionId) => {
              setDeleteAllFirstSessionId(firstSessionId ?? null);
              setDeleteAllOpen(true);
            }}
            onViewVideo={setVideoModalSessionId}
            onViewLog={handleViewLog}
            onDeleteSession={setDeleteSessionId}
          />
        </>
      )}

      <ModalVideo
        sessionId={videoModalSessionId}
        open={!!videoModalSessionId}
        onClose={() => setVideoModalSessionId(null)}
      />
      <ModalDeleteAll
        open={deleteAllOpen}
        onClose={() => setDeleteAllOpen(false)}
        firstSessionId={deleteAllFirstSessionId}
        onSuccess={() => {
          setDeleteAllOpen(false);
          queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
          toast.success(t('toast.deleteAllSuccess'));
        }}
        onError={() => toast.error(t('toast.deleteAllError'))}
      />
      <ModalDeleteSession
        sessionId={deleteSessionId}
        open={!!deleteSessionId}
        onClose={() => setDeleteSessionId(null)}
        onSuccess={() => {
          setDeleteSessionId(null);
          queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
          toast.success(t('toast.deleteSessionSuccess'));
        }}
        onError={(msg) => toast.error(msg || t('toast.deleteSessionError'))}
      />
    </Layout>
  );
}
