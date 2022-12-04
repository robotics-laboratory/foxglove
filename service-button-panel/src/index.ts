import { ExtensionContext } from "@foxglove/studio";
import { initButtonPanel } from "./ButtonPanel";
import "./style.css";

export function activate(extensionContext: ExtensionContext): void {
  extensionContext.registerPanel({ name: "Service Button", initPanel: initButtonPanel });
}
