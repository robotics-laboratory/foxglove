import { ExtensionContext } from "@foxglove/studio";
import { initStreamPanel } from "./StreamPanel";
import "./style.css";

export function activate(extensionContext: ExtensionContext): void {
  extensionContext.registerPanel({ name: "Live Stream", initPanel: initStreamPanel });
}
