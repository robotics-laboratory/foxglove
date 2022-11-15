import { PanelExtensionContext } from "@foxglove/studio";
import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useConfig } from "./settings";
import { Player } from "./player";
import cx from 'classnames';


function StreamPanel({ context }: { context: PanelExtensionContext }): JSX.Element {
  const canvas = useRef(null);
  const config = useConfig(context);
  const [error, setError] = useState("Loading...");
  const player = useRef(null) as any;

  const connect = () => {
    console.log("connect click");
    player.current.start(config.url);
    setError("Connecting...");
  };

  useEffect(() => {
    player.current = new Player(canvas.current);
    player.current.addListener("error", () => { setError("Websocket error") });
    player.current.addListener("stop", () => { setError("Player stopped") });
    player.current.addListener("open", () => { setError("") });
    connect();
  }, []);

  useEffect(() => {
    if (player.current) player.current.stop();
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
