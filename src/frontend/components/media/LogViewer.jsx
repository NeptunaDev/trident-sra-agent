import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient, API_V1 } from '../../api/client';

export default function LogViewer({ open, sessionId, onClose }) {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !sessionId) return;
    let active = true;
    setLoading(true);
    setContent('');

    apiClient
      .get(`${API_V1}/view/log`, { params: { sessionId }, responseType: 'text' })
      .then((res) => {
        if (!active) return;
        setContent(typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2));
      })
      .catch(() => {
        if (!active) return;
        setContent(t('media.logLoadError'));
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, sessionId, t]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" role="dialog" aria-modal="true">
      <div className="bg-[#1a1a2e] border border-[rgba(91,194,231,0.2)] rounded-lg shadow-xl max-w-4xl w-full mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neptuna/20">
          <h2 className="text-lg font-semibold text-white">{t('media.logViewerTitle')}</h2>
          <button type="button" onClick={onClose} className="text-[#c0c5ce] hover:text-[#5bc2e7] hover:bg-[#11111f] px-2 py-1 rounded">
            {t('modal.close')}
          </button>
        </div>
        <div className="p-4 max-h-[70vh] overflow-auto bg-[#0a0a0f]">
          {loading ? (
            <p className="text-sm text-[#9ca3af]">{t('sessions.loading')}</p>
          ) : (
            <pre className="text-xs text-[#c0c5ce] whitespace-pre-wrap break-words">{content || '—'}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
