import { ExtensionContext } from "@foxglove/studio";
import { initButtonPanel } from "./ButtonPanel";
import { initStreamPanel } from "./StreamPanel";
import "./style.css";

export function activate(extensionContext: ExtensionContext): void {
  extensionContext.registerPanel({ name: "Live Stream", initPanel: initStreamPanel });
  extensionContext.registerPanel({ name: "Demo Panel", initPanel: initButtonPanel });
}
