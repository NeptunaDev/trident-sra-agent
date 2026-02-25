import { useState } from 'react';

export default function ForceCloseButton({ sessionId, onForceClose }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-2 py-1 rounded text-xs text-[#ff6b6b] border border-[#ff6b6b]/40 hover:bg-[#ff6b6b]/10"
      >
        Cerrar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
          <div className="bg-[#1a1a2e] border border-[rgba(91,194,231,0.2)] rounded-lg p-4 w-full max-w-sm">
            <p className="text-white font-semibold mb-2">Cierre forzado</p>
            <p className="text-[#c0c5ce] text-sm mb-4">¿Cerrar sesión activa {sessionId}?</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 rounded border border-[rgba(91,194,231,0.2)] text-[#c0c5ce]">Cancelar</button>
              <button
                type="button"
                onClick={() => {
                  onForceClose(sessionId);
                  setOpen(false);
                }}
                className="px-3 py-2 rounded bg-[#ff6b6b] text-white"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
