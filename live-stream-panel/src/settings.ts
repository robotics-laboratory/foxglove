import { PanelExtensionContext, SettingsTreeAction, SettingsTreeNode, SettingsTreeNodes } from "@foxglove/studio";
import { useCallback, useEffect, useMemo, useState } from "react";
import { set } from "lodash";
import produce from "immer";

// A lot of boilerplate code related to settings. References:
// https://github.com/foxglove/studio/blob/main/packages/studio-base/src/panels/Plot/settings.ts
// https://github.com/foxglove/studio/blob/main/packages/studio-base/src/panels/Indicator/settings.ts
// https://github.com/foxglove/studio/blob/main/packages/studio-base/src/panels/Gauge/settings.ts

export type Config = {
  url: string;
};

export const defaultConfig: Config = {
  url: `ws://${location.hostname}:5555`,
};

export function validateWebsocketURL(value: string): string | undefined {
  try {
    let url = new URL(value);
    if (url.protocol === "ws:" || url.protocol === "wss:") return undefined;
    return "Must be a websocket URL (ws: or wss:)";
  } catch (_) {
    return "Invalid URL";
  }
}

export function useSettingsTree(config: Config): SettingsTreeNodes {
  const generalSettings = useMemo(
    (): SettingsTreeNode => ({
      fields: {
        url: {
          label: "URL",
          input: "string",
          value: config.url,
          placeholder: "Stream websocket URL",
          error: validateWebsocketURL(config.url),
        },
      },
    }),
    [config],
  );
  return { general: generalSettings };
}

export function settingsActionReducer(prevConfig: Config, action: SettingsTreeAction): Config {
  return produce(prevConfig, (draft) => {
    switch (action.action) {
      case "perform-node-action":
        throw new Error(`Unhandled node action: ${action.payload.id}`);
      case "update":
        switch (action.payload.path[0]) {
          case "general":
            set(draft, [action.payload.path[1]!], action.payload.value);
            break;
          default:
            throw new Error(`Unexpected payload.path[0]: ${action.payload.path[0]}`);
        }
        break;
    }
  });
}

export function useConfig(context: PanelExtensionContext): Config {
  const [config, setConfig] = useState(() => ({
    ...defaultConfig,
    ...(context.initialState as Partial<Config>),
  }));

  const settingsActionHandler = useCallback(
    (action: SettingsTreeAction) =>
      setConfig((prevConfig) => settingsActionReducer(prevConfig, action)),
    [setConfig],
  );

  const settingsTree = useSettingsTree(config);
  useEffect(() => {
    context.updatePanelSettingsEditor({
      actionHandler: settingsActionHandler,
      nodes: settingsTree,
    });
  }, [context, settingsActionHandler, settingsTree]);

  useEffect(() => {
    context.saveState(config);
  }, [config, context]);

  return config;
}
