import { useEffect, useRef } from "react";
import Guacamole from "../vendor/guacamole-common.js";

function isTextInputFocused() {
  const active = document.activeElement;
  if (!active) return false;
  const tag = active.tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea") return true;
  return active.isContentEditable === true;
}

export default function RemoteDisplay({ token, onDisconnect, onError }) {
  const containerRef = useRef(null);
  const clientRef = useRef(null);
  const keyboardRef = useRef(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    if (!token || !containerRef.current) return;

    // URL base; el token se pasa a connect(data). La librería hace new WebSocket(tunnelURL + "?" + data).
    const webSocketUrl = "ws://localhost:8080/";
    const tunnel = new Guacamole.WebSocketTunnel(webSocketUrl);
    const client = new Guacamole.Client(tunnel);
    clientRef.current = client;

    const handleError = () => {
      onErrorRef.current?.();
    };
    if (tunnel.onerror !== undefined) tunnel.onerror = handleError;
    if (client.onerror !== undefined) client.onerror = handleError;

    containerRef.current.innerHTML = "";
    const display = client.getDisplay();
    const displayElement = display.getElement();
    containerRef.current.appendChild(displayElement);

    // Escalar el display al tamaño del contenedor; sin esto la imagen no se ve (sí el sonido).
    display.onresize = (width, height) => {
      if (!width || !height || !containerRef.current) return;
      const container = containerRef.current;
      const scale = Math.min(
        container.clientWidth / width,
        container.clientHeight / height,
      );
      display.scale(scale);
    };

    const mouse = new Guacamole.Mouse(displayElement);
    mouse.onmousedown =
      mouse.onmouseup =
      mouse.onmousemove =
        (state) => {
          if (clientRef.current) clientRef.current.sendMouseState(state);
        };

    if (!keyboardRef.current) {
      const keyboard = new Guacamole.Keyboard(document);
      keyboardRef.current = keyboard;
      keyboard.onkeydown = (keysym) => {
        if (!clientRef.current || isTextInputFocused()) return true;
        clientRef.current.sendKeyEvent(1, keysym);
        return false;
      };
      keyboard.onkeyup = (keysym) => {
        if (!clientRef.current || isTextInputFocused()) return true;
        clientRef.current.sendKeyEvent(0, keysym);
        return false;
      };
    }

    // guacamole-lite espera: ws://host:8080/?token=ENCODED_TOKEN
    client.connect("token=" + encodeURIComponent(token));

    return () => {
      const clientToDisconnect = clientRef.current;
      clientRef.current = null;
      // Diferir disconnect para no cerrar el WebSocket en el mismo tick que el cleanup
      // (React StrictMode monta/desmonta/monta y cerrar aquí rompía la primera conexión).
      setTimeout(() => {
        if (clientToDisconnect) clientToDisconnect.disconnect();
      }, 0);
    };
  }, [token]);

  return (
    <div className="flex-1 relative min-h-0 bg-[#0a0a0f] flex items-center justify-center">
      <div
        ref={containerRef}
        id="display"
        className="w-full h-full min-h-[400px] flex items-center justify-center"
        tabIndex={-1}
      />
    </div>
  );
}
