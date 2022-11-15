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
  // TODO: Request available resolutions and framerates from server
  resolution: "480x270" | "640x480" | "848x480" | "1280x720" | "1280x800";
  framerate: "5" | "15" | "30" | "60" | "90";
  bitrate: number;
};

export const defaultConfig: Config = {
  url: `ws://${location.hostname}:5555`,
  resolution: "640x480",
  framerate: "15",
  bitrate: 600,
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

export function validateBitrate(value: number): string | undefined {
  if (1 <= value && value <= 1e6) return undefined;
  return "Invalid bitrate, should be in range [1 kbps ... 1 Gbps]";
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
        resolution: {
          label: "Resolution",
          input: "select",
          value: config.resolution,
          options: [
            { label: "480x270", value: "480x270" },
            { label: "640x480", value: "640x480" },
            { label: "848x480", value: "848x480" },
            { label: "1280x720", value: "1280x720" },
            { label: "1280x800", value: "1280x800" },
          ],
        },
        framerate: {
          label: "Framerate",
          input: "select",
          value: config.framerate,
          options: [
            { label: "5", value: "5" },
            { label: "15", value: "15" },
            { label: "30", value: "30" },
            { label: "60", value: "60" },
            { label: "90", value: "90" },
          ]
        },
        bitrate: {
          label: "Bitrate (kbps)",
          input: "number",
          value: config.bitrate,
          error: validateBitrate(config.bitrate),
        }
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
