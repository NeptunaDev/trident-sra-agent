import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Guacamole from '../vendor/guacamole-common.js';
import { getViewVideoUrl } from '../api/endpoints';

export default function ModalVideo({ sessionId, open, onClose }) {
  const { t } = useTranslation();
  const displayRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (!open || !sessionId || !displayRef.current) return;

    const videoUrl = getViewVideoUrl(sessionId);
    const tunnel = new Guacamole.StaticHTTPTunnel(videoUrl);
    const sessionRecording = new Guacamole.SessionRecording(tunnel);
    playerRef.current = sessionRecording;

    const playerDisplay = sessionRecording.getDisplay();
    const el = playerDisplay.getElement();
    displayRef.current.innerHTML = '';
    displayRef.current.appendChild(el);

    playerDisplay.onresize = (width, height) => {
      if (!width || !height || !displayRef.current) return;
      const scale = Math.min(displayRef.current.clientWidth / width, 600 / height);
      playerDisplay.scale(scale);
    };

    sessionRecording.connect();
    const playTimeout = setTimeout(() => {
      if (playerRef.current) playerRef.current.play();
    }, 1000);

    return () => {
      clearTimeout(playTimeout);
      sessionRecording.pause();
      sessionRecording.disconnect();
      playerRef.current = null;
      if (displayRef.current) displayRef.current.innerHTML = '';
    };
  }, [open, sessionId]);

  const handlePlay = () => {
    if (playerRef.current) playerRef.current.play();
  };
  const handlePause = () => {
    if (playerRef.current) playerRef.current.pause();
  };
  const handleRestart = () => {
    if (playerRef.current) playerRef.current.seek(0);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" role="dialog" aria-modal="true">
      <div className="bg-[#1a1a2e] border border-[rgba(91,194,231,0.2)] rounded-lg shadow-xl max-w-4xl w-full mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neptuna/20">
          <h2 className="text-lg font-semibold text-white">{t('modal.videoTitle')}</h2>
          <button type="button" onClick={onClose} className="text-[#c0c5ce] hover:text-[#5bc2e7] hover:bg-[#11111f] px-2 py-1 rounded">
            {t('modal.close')}
          </button>
        </div>
        <div ref={displayRef} className="min-h-[400px] bg-[#0a0a0f] flex items-center justify-center" />
        <div className="flex gap-2 px-4 py-3 border-t border-neptuna/20 bg-[#11111f]">
          <button type="button" onClick={handlePlay} className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#5bc2e7] to-[#4ba8d1] hover:from-[#4ba8d1] hover:to-[#5bc2e7] text-[#11111f] font-semibold">
            {t('modal.play')}
          </button>
          <button type="button" onClick={handlePause} className="px-4 py-2 rounded-lg text-white hover:bg-[#1a1a2e] border border-[rgba(91,194,231,0.2)]">
            {t('modal.pause')}
          </button>
          <button type="button" onClick={handleRestart} className="px-4 py-2 rounded-lg text-white hover:bg-[#1a1a2e] border border-[rgba(91,194,231,0.2)]">
            {t('modal.restart')}
          </button>
        </div>
      </div>
    </div>
  );
}
