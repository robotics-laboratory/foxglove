import { PanelExtensionContext } from "@foxglove/studio";
import { useConfig } from "./IFramePanelSettings";
import ReactDOM from "react-dom";

function IFramePanel({ context }: { context: PanelExtensionContext }): JSX.Element {
  const config = useConfig(context);

  return (
    <div className="iframe-panel">
      {config.enabled && <iframe src={config.url}></iframe>}
      {!config.enabled && <div className="disabled-label">🚫 IFrame Disabled</div>}
    </div>
  );
}

export function initIFramePanel(context: PanelExtensionContext): void {
  ReactDOM.render(<IFramePanel context={context} />, context.panelElement);
}
