import { ExtensionContext } from "@foxglove/studio";
import { initStreamPanel } from "./StreamPanel";

export function activate(extensionContext: ExtensionContext): void {
  extensionContext.registerPanel({ name: "Live Stream Panel", initPanel: initStreamPanel });
}
