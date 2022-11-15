import { PanelExtensionContext } from "@foxglove/studio";
import ReactDOM from "react-dom";


function ButtonPanel({context}: { context: PanelExtensionContext }): JSX.Element {
  const callback = () => {
    context.callService!("/control_demo/reset_path", {});
  };

  return (
    <div className="live-stream-panel error">
      <button className="button" onClick={callback}>Reset Trajectory</button>
    </div>
  );
}

export function initButtonPanel(context: PanelExtensionContext): void {
  ReactDOM.render(<ButtonPanel context={context} />, context.panelElement);
}
