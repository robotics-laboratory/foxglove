import { PanelExtensionContext } from "@foxglove/studio";
import { useEffect, useRef } from "react";
import ReactDOM from "react-dom";

const WSAvcPlayer = require("h264-live-player");
let wsavc: any = null; // Singleton instance of WSAvcPlayer

function StreamPanel({}: { context: PanelExtensionContext }): JSX.Element {
  const canvas = useRef(null);

  useEffect(() => {
    if (wsavc !== null) wsavc.disconnect();
    wsavc = new WSAvcPlayer(canvas.current, "webgl", 1, 35);
    wsavc.connect("ws://jetson-nx-2.local:5555");
    setTimeout(() => { wsavc.playStream() }, 1000);
  }, []);

  return (
    <div style={{ padding: "1rem" }}>
      <canvas ref={canvas}></canvas>
    </div>
  );
}

export function initStreamPanel(context: PanelExtensionContext): void {
  ReactDOM.render(<StreamPanel context={context} />, context.panelElement);
}
