import { PanelExtensionContext } from "@foxglove/studio";
import { useConfig, validateJSON } from "./ButtonPanelSettings";
import ReactDOM from "react-dom";


function ButtonPanel({ context }: { context: PanelExtensionContext }): JSX.Element {
  const config = useConfig(context);

  // TODO: Try to use enqueueSnackbar via notistack.useSnackbar somehow?
  const alert = (message: string, level: "success" | "error") => {
    console.log("[ButtonPanel]", level, message);
    if (level === "success") return;
    window.alert(`[${level.toUpperCase()}] ${message}`);
  }

  const callback = async () => {
    if (!context.callService) {
      alert("Service calls not available (are you connected?)", "error");
      return;
    }
    if (validateJSON(config.payload)) {
      alert("Invalid service payload", "error");
      return;
    }
    try {
      let res = await context.callService(config.service, JSON.parse(config.payload));
      alert(`Service response: ${JSON.stringify(res)}`, "success");
    } catch (err) {
      alert(`Service call failed: ${err}`, "error");
    }
  };

  return (
    <div className="service-button-panel">
      <div className="foxglove-button" onClick={callback}>{config.label}</div>
    </div>
  );
}

export function initButtonPanel(context: PanelExtensionContext): void {
  ReactDOM.render(<ButtonPanel context={context} />, context.panelElement);
}
