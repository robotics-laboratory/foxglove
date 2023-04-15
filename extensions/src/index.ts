import { ExtensionContext } from "@foxglove/studio";
import { initCartPolePanel } from "./CartPolePanel";
import { initIFramePanel } from "./IFramePanel";
import { initButtonPanel } from "./ButtonPanel";
import "./style.css";

export function activate(extensionContext: ExtensionContext): void {
  extensionContext.registerPanel({ name: "CartPole Panel", initPanel: initCartPolePanel });
  extensionContext.registerPanel({ name: "IFrame Panel", initPanel: initIFramePanel });
  extensionContext.registerPanel({ name: "Button Panel", initPanel: initButtonPanel });
}
