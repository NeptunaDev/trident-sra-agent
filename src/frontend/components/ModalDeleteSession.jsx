import { useState, useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { deleteSession } from '../api/endpoints';

export default function ModalDeleteSession({ sessionId, open, onClose, onSuccess, onError }) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setInput('');
  }, [open, sessionId]);

  const canConfirm = (input || '').trim() === (sessionId || '').trim();
  const handleConfirm = async () => {
    if (!canConfirm || !sessionId || loading) return;
    setLoading(true);
    try {
      const res = await deleteSession(sessionId);
      if (res?.ok) {
        onSuccess();
      } else {
        onError(res?.error || t('toast.deleteSessionError'));
      }
    } catch {
      onError();
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-delete-session-title"
    >
      <div className="bg-[#1a1a2e] border border-[rgba(91,194,231,0.2)] rounded-lg shadow-xl max-w-md w-full mx-4 p-4">
        <h2 id="modal-delete-session-title" className="text-lg font-semibold text-white mb-2">
          {t('modal.deleteSessionTitle')}
        </h2>
        <p className="text-[#c0c5ce] text-sm mb-4">
          <Trans i18nKey="modal.deleteSessionWarning" components={{ strong: <strong /> }} />
        </p>
        <p className="text-[#c0c5ce] text-sm mb-2">
          <Trans i18nKey="modal.deleteSessionHint" components={{ strong: <strong /> }} />
        </p>
        <code className="block mb-2 px-2 py-1 bg-[#11111f] border border-neptuna/20 rounded text-[#5bc2e7] text-sm break-all">
          {sessionId}
        </code>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
          placeholder={t('modal.deleteSessionPlaceholder')}
          className="w-full px-3 py-2 bg-[#11111f] border border-[rgba(91,194,231,0.2)] focus:border-[#5bc2e7] text-white placeholder:text-[#6b7280] rounded mb-4"
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[#c0c5ce] hover:text-[#5bc2e7] hover:bg-[#11111f]"
          >
            {t('modal.cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#5bc2e7] to-[#4ba8d1] hover:from-[#4ba8d1] hover:to-[#5bc2e7] text-[#11111f] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('modal.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
