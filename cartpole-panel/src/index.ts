import { ExtensionContext } from "@foxglove/studio";
import { initCartPolePanel } from "./CartPolePanel";
import "./style.css";

export function activate(extensionContext: ExtensionContext): void {
  extensionContext.registerPanel({ name: "CartPole Panel", initPanel: initCartPolePanel });
}
