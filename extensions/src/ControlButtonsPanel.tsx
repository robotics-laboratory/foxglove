import { PanelExtensionContext, SettingsTreeAction, SettingsTreeNode, SettingsTreeNodes, Topic } from "@foxglove/studio";
import { MouseEventHandler, createRef, useCallback, useEffect, useLayoutEffect, useState } from "react";
import ReactDOM from "react-dom";
import _ from "lodash";


const upArrow = ["M64.1 0C28.8 0 .2 28.7.2 64s28.6 64 63.9 64S128 99.3 128 " +
                 "64c-.1-35.3-28.7-64-63.9-64zm0 122.7C31.7 122.7 5.5 96.4 5.5 " +
                 "64c0-32.4 26.2-58.7 58.6-58.7 32.3 0 58.6 26.3 58.6 58.7-.1 " +
                 "32.4-26.3 58.7-58.6 58.7zm-.3-93.9L33.1 59.5l3.8 3.8 " +
                 "24.5-24.5V104h5.3V39.4l24 24 3.8-3.8-30.7-30.8z", ];

const downArrow = ["M64.1 0C28.8 0 .2 28.7.2 64s28.6 64 63.9 64S128 99.3 128 " +
                   "64c-.1-35.3-28.7-64-63.9-64zm0 122.7C31.7 122.7 5.5 96.4 5.5 " +
                   "64c0-32.4 26.2-58.7 58.6-58.7s58.6 26.3 58.6 58.7c-.1 32.4-26.3 " +
                   "58.7-58.6 58.7zm2.6-34.2V24h-5.3v64.5L37.1 64.2 " +
                   "33.3 68 64 98.8l.1-.1.1.1L94.9 68 91 64.2 66.7 88.5z", ];

const leftArrow = ["m64 37-3.8-3.8L29.5 64l30.7 30.8L64 91 39.8 66.7H104v-5.3H39.8L64 " +
                   "37zm.1-37C28.8 0 .2 28.7.2 64s28.6 64 63.9 64S128 99.3 128 " +
                   "64c-.1-35.3-28.7-64-63.9-64zm0 122.7C31.7 122.7 5.5 96.4 5.5 " +
                   "64c0-32.4 26.2-58.7 58.6-58.7s58.6 26.3 58.6 58.7c-.1 32.4-26.3 58.7-58.6 58.7z", ];

const rightArrow = ["m68.4 33.5-3.8 3.8L89.2 62H24.1v5.3h64.3l-23.8 24 3.8 3.8 " +
                    "30.7-30.8-.1-.1.1-.1-30.7-30.6zM64.1 0C28.8 0 .2 28.7.2 64s28.6 " +
                    "64 63.9 64S128 99.3 128 64c-.1-35.3-28.7-64-63.9-64zm0 122.7C31.7 " +
                    "122.7 5.5 96.4 5.5 64c0-32.4 26.2-58.7 58.6-58.7 32.3 0 58.6 26.3 " +
                    "58.6 58.7-.1 32.4-26.3 58.7-58.6 58.7z", ];

const lockButton = ["M51.5 103.229h25a1.75 1.75 0 0 0 1.685-2.223L73.14 83.014a12.462 12.462 0 1 0-18.28 0l-5.045 17.993a1.75 1.75 0 0 0 1.685 2.223zm7.008-20.263a1.75 1.75 0 0 0-.513-1.772 8.962 8.962 0 1 1 12.011 0 1.75 1.75 0 0 0-.513 1.772l4.7 16.763H53.808z",
                    "M112.654 40.135H94.5V35.25a30.5 30.5 0 0 0-61 0v4.885H15.346a1.75 1.75 0 0 0-1.75 1.75V121.5a1.75 1.75 0 0 0 1.75 1.75h97.308a1.75 1.75 0 0 0 1.75-1.75V41.885a1.75 1.75 0 0 0-1.75-1.75zM37 35.25a27 27 0 1 1 54 0v4.885h-2.5V35.25a24.5 24.5 0 0 0-49 0v4.885H37zm48 4.885H43V35.25a21 21 0 0 1 42 0zm25.9 79.615H17.1V43.635h93.8z"];

export const focusGradient = "radial-gradient(circle, rgba(162,186,199,0.6306897759103641) 0%, rgba(148,187,233,0) 78%)";

interface PanelButtonOptions {
  arrow_svg: Array<string>;
  row: string;
  col: string;
  is_focused: Function;
  MouseClickHandler?: MouseEventHandler<HTMLDivElement>;
  MouseDownHandler?: MouseEventHandler<HTMLDivElement>
}

type Config = {
  topic: undefined | string;
  frequency: number;
};

type ButtonPanelProps = {
  context: PanelExtensionContext
}

function buildSettingsTree(config: Config, topics: readonly Topic[]): SettingsTreeNodes {
  const general: SettingsTreeNode = {
    label: "General",
    fields: {
      frequency: { label: "Frequency", input: "number", value: config.frequency },
      topic: {
        label: "Topic",
        input: "autocomplete",
        value: config.topic,
        items: topics.map((t) => t.name),
      },
    },
  };

  return { general };
}

const lockRef = createRef<HTMLInputElement>()

function PanelButton({ arrow_svg, row, col, is_focused,
                       MouseClickHandler=undefined,
                       MouseDownHandler=undefined}: PanelButtonOptions): JSX.Element {
  return (
    <div style={{gridRow: row, gridColumn: col}}
         onClick={MouseClickHandler} onMouseDown={MouseDownHandler}>
      <svg style={{background: is_focused() ? focusGradient : "0"}}
           version="1.1" x="0" y="0" viewBox="0 0 128 128">
          {(arrow_svg ?? []).map((item) => (
            <path d={item}/>
          ))}
      </svg>
    </div>);
}


function ConttrolButtonsPanel(props: ButtonPanelProps): JSX.Element {
  
  const { context } = props;
  const { saveState } = context;

  const [velocity, setVelocity] = useState<number>(0);
  const [steering, setSteering] = useState<number>(0);
  
  const moveForward = () => velocity ? setVelocity(0) :setVelocity(1);
  const moveBackward = () => velocity ? setVelocity(0) :setVelocity(-1);
  const steerLeft = () => steering ? setSteering(0) : setSteering(-1);
  const steerRight = () => steering ? setSteering(0) : setSteering(1);
  
  const stopSteer = () => setSteering(0);
  const stopMovement = () => setVelocity(0);
  const stopVehicle = () => {
    stopMovement();
    stopSteer();
  }
  const getPositionMessage = () => new Map<string, number>([["velocity", velocity], ["steering", steering]]);

  const [is_locked, setLockState] = useState<boolean>(false);
  const changeLockedState = () => {
    const node = lockRef.current
    if (node) {
      is_locked ? node.blur() : node.focus()
    }
    setLockState(!is_locked)
  }

  const [topics, setTopics] = useState<readonly Topic[]>([]);

  const [keyValue] = useState<string>(" ");
  
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.code == "ArrowLeft")  {
        steerLeft()
      }
      if (event.code == "ArrowUp")  {
        moveForward()
      }
      if (event.code == "ArrowRight")  {
        steerRight()
      }
      if (event.code == "ArrowDown")  {
        moveBackward()
      }
    },
    [steerLeft, moveForward, steerRight, moveForward],
  );

  const onKeyUp = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      event.preventDefault();
      event.stopPropagation();
      stopMovement()
    },
    [stopMovement],
  );
  
  const [config, setConfig] = useState<Config>(() => {
    const partialConfig = context.initialState as Partial<Config>;
    const {
      topic,
      frequency = 60,
    } = partialConfig;
    return {
      topic,
      frequency,
    };
  });

  const settingsActionHandler = useCallback((action: SettingsTreeAction) => {
    if (action.action !== "update") {
      return;
    }
    setConfig((previous) => {
      const newConfig = { ...previous };
      _.set(newConfig, action.payload.path.slice(1), action.payload.value);
      return newConfig;
    });
  }, []);

  const [renderDone, setRenderDone] = useState<() => void>(() => () => {});
  useLayoutEffect(() => {
    context.watch("topics");

    context.onRender = (renderState, done) => {
      setTopics(renderState.topics ?? []);
      setRenderDone(() => done);
    };
  }, [context]);

  useEffect(() => {
    const tree = buildSettingsTree(config, topics);
    context.updatePanelSettingsEditor({
      actionHandler: settingsActionHandler,
      nodes: tree,
    });
    saveState(config);
  }, [config, context, saveState, settingsActionHandler, topics]);


  const { topic: currentTopic } = config;
  useLayoutEffect(() => {
    if (!currentTopic) {
      return;
    }

    context.advertise?.(currentTopic, "geometry_msgs/Twist", {
      datatypes: new Map([
        ["geometry_msgs/Vector3", ["geometry_msgs/Vector3"]],
        ["geometry_msgs/Twist", ["geometry_msgs/Twist"]],
      ]),
    });

    return () => {
      context.unadvertise?.(currentTopic);
    };
  }, [context, currentTopic]);
  
  useLayoutEffect(() => {
    if (config.frequency <= 0) {
      return;
    }
    if (currentTopic) {
      const intervalMs = (1000) / config.frequency;
      context.publish?.(currentTopic, getPositionMessage());
      const intervalHandle = setInterval(() => {
        context.publish?.(currentTopic, getPositionMessage());
      }, intervalMs);
      return () => {
        clearInterval(intervalHandle);
      };
    }
    return
  }, [context, config, currentTopic]);

  useLayoutEffect(() => {
    renderDone();
  }, [renderDone]);

  return (
    <div style={{ padding: "1rem" }}>
      <p>{getPositionMessage()}</p>
      <input type="text" style={{opacity: 0}} value={keyValue} ref={lockRef} onKeyDown={onKeyDown} onKeyUp={onKeyUp}/>
      <div style={{display: "grid",gridTemplateColumns: "repeat(9, 1fr)",
                   gap: "10px", gridAutoRows: "minmax(50px, auto)"}}
           onMouseUp={stopVehicle}>
        <PanelButton row={"1"} col={"7"} arrow_svg={lockButton} is_focused={() => is_locked}
                     MouseClickHandler={changeLockedState}/>
        <PanelButton row={"2"} col={"5"} arrow_svg={upArrow} is_focused={() => velocity == 1}
                     MouseDownHandler={moveForward}/>
        <PanelButton row={"3"} col={"4"} arrow_svg={leftArrow} is_focused={() => steering == -1}
                     MouseDownHandler={steerLeft}/>
        <PanelButton row={"3"} col={"5"} arrow_svg={downArrow} is_focused={() => velocity == -1}
                     MouseDownHandler={moveBackward}/>
        <PanelButton row={"3"} col={"6"} arrow_svg={rightArrow} is_focused={() => steering == 1}
                     MouseDownHandler={steerRight}/>
      </div>
      <div>{topics?.map(() => <span> </span>)}</div>
    </div>
  );
}

export function initControlButtonsPanel(context: PanelExtensionContext): () => void {
  ReactDOM.render(<ConttrolButtonsPanel context={context} />, context.panelElement);
  return () => {
    ReactDOM.unmountComponentAtNode(context.panelElement);
  };
}
