import { PanelExtensionContext } from "@foxglove/studio";
import { useEffect, useRef, useState } from "react";
import { WSAvcPlayer } from "ts-h264-live-player";
import { useConfig } from "./settings";
import ReactDOM from "react-dom";
import cx from "classnames";

// https://github.com/TeaFlex/ts-h264-live-player/blob/master/src/wsavc/WSAvcPlayer.ts
// https://github.com/TeaFlex/ts-h264-live-player/tree/master/src/canvas
const canvasMode = "YUVWebGLCanvas";

function StreamPanel({ context }: { context: PanelExtensionContext }): JSX.Element {
  const config = useConfig(context);
  const [error, setError] = useState("Ready to connect");
  const canvas = useRef(null) as any;
  const socket = useRef(null) as any;
  const player = useRef(null) as any;

  const onOpen = () => {
    if (socket.current.readyState === WebSocket.OPEN) setError("");
  };

  const onClose = () => {
    setError("Connection closed");
  };

  const connect = () => {
    if (socket.current) disconnect();
    let prevSocket = (window as any).__streamPanel_socket;
    if (prevSocket) prevSocket.close();
    socket.current = (window as any).__streamPanel_socket = new WebSocket(config.url);
    socket.current.binaryType = "arraybuffer";
    socket.current.addEventListener("open", onOpen);
    socket.current.addEventListener("close", onClose);
    player.current = new WSAvcPlayer(canvas.current, canvasMode);
    player.current.connectWithCustomClient(socket.current);
    setError("Connecting...");
  };

  const disconnect = () => {
    if (socket.current) {
      socket.current.removeEventListener("open", onOpen);
      socket.current.removeEventListener("close", onClose);
      socket.current.close();
      socket.current = null;
      setError("Disconnected");
    }
  };

  useEffect(() => {
    disconnect();
    setError("Settings updated");
  }, [config]);

  return (
    <div className={cx("live-stream-panel", { "error": error !== "" })}>
      <p className="error">⚠️ {error}</p>
      <button className="button" onClick={connect}>Reconnect</button>
      <canvas className="canvas" ref={canvas}></canvas>
    </div>
  );
}

export function initStreamPanel(context: PanelExtensionContext): void {
  ReactDOM.render(<StreamPanel context={context} />, context.panelElement);
}
