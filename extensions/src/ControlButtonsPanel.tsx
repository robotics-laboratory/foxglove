import { PanelExtensionContext, SettingsTreeAction, SettingsTreeNode, SettingsTreeNodes, Topic } from "@foxglove/studio"
import { ros2humble as ros2 } from "@foxglove/rosmsg-msgs-common";
import { createRef, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import FocusLock from "react-focus-lock";
import _, { isUndefined } from "lodash";

import { Joystick, JoystickShape } from "react-joystick-component"

import { createTheme, ThemeProvider } from "@mui/system";
import LockOpenTwoToneIcon from "@mui/icons-material/LockOpenTwoTone";
import LockTwoToneIcon from "@mui/icons-material/LockTwoTone";
import SyncDisabledIcon from '@mui/icons-material/SyncDisabled';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
import Looks3Icon from '@mui/icons-material/Looks3';

import { IJoystickUpdateEvent } from "react-joystick-component/build/lib/Joystick";

// EATS A LOT OF CPU
function useRefDimensions(ref: React.RefObject<HTMLDivElement>, dimensionsFunctions: any) {
  const {dimensions, setDimensions} = dimensionsFunctions

  const savedDimensions = useMemo(
    () => dimensions,
    [dimensions]
    )

  useEffect(() => {
    if (ref.current) {
      const boundingRect = ref.current.getBoundingClientRect()
      const { width, height } = boundingRect
      setDimensions({ width: Math.round(width), height: Math.round(height) })
    }
  }, [ref])
  return savedDimensions
}

function useInterval(callback: any, delay: any) {
  const savedCallback = useRef<Function>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
 
  useEffect(() => {
    function tick() {
      savedCallback?.current?.call(savedCallback?.current);
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      console.log('cleared', id)
      return () => clearInterval(id);
    }
    return;
  }, [delay]);
}

const connectGamePadControl = (movementFunctions: any) => {
  const {setVelocity, setSteering, stopVehicle} = movementFunctions;

  let haveEvents = 'GamepadEvent' in window;
  let rAF = window.requestAnimationFrame;

  const connectHandler = (event: GamepadEvent) => {
    console.log("connected", event.gamepad)
    addGamepad(event.gamepad);
  }

  const disconnectHandler = (event: GamepadEvent) => {
    console.log("disconnected")
    removeGamepad(event.gamepad);
    stopVehicle()
  }

  const addGamepad = (gamepad: Gamepad) => {
    controllers.set(gamepad.index, gamepad)
    rAF(updateStatus);
  }

  const removeGamepad = (gamepad: Gamepad) => {
    controllers.delete(gamepad.index)
  }

  const scanGamepads = () => {
    let gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i]) {
        return gamepads[i];
      }
    }
    return null;
  }

  const updateStatus = () => {
    let controller = scanGamepads();
    const x = controller?.axes?.at(2)
    const y = controller?.axes?.at(1)
    if (y) {
      setVelocity(-y)
    }
    if (x) {
      setSteering(x)
    }
    let buttons = controller?.buttons
    if (buttons) {
      if (buttons[0]?.pressed) {
        console.log("X pressed")
      }
      if (buttons[1]?.pressed) {
        console.log("O pressed")
      }
      if (buttons[2]?.pressed) {
        console.log("Square pressed")
      }
      if (buttons[3]?.pressed) {
        console.log("Triangle pressed")
      }
    }
    rAF(updateStatus);
  }

  if (haveEvents) {
    window.addEventListener("gamepadconnected", connectHandler);
    window.addEventListener("gamepaddisconnected", disconnectHandler);
  } else {
    setInterval(scanGamepads, 500);
  }
}

const movementDirections = (velocity: number, steering: number) => [velocity >= 0 ? velocity : undefined, velocity <= 0 ? velocity : undefined,
                                                                    steering <= 0 ? steering : undefined, steering >= 0 ? steering : undefined];

function checkButtonns(panelData: any, buttonsData: any, movementFunctions: any) {
  const {locked, mode, velocity, steering} = panelData;
  const {upArrowPressed, downArrowPressed, leftArrowPressed, rightArrowPressed} = buttonsData;
  const {setVelocity, setSteering, stopMovement, stopSteer} = movementFunctions;
  const functionsArray = [setVelocity, setVelocity, setSteering, setSteering]
  if (!locked || !mode) {
    return;
  }

  const step = 0.05;
  if ((upArrowPressed && downArrowPressed) || (upArrowPressed && velocity < 0) || (downArrowPressed && velocity > 0)) {
    stopMovement();
  }
  if ((leftArrowPressed && rightArrowPressed) || (leftArrowPressed && steering > 0) || (rightArrowPressed && steering < 0)) {
    stopSteer();
  }

  const buttons = [upArrowPressed, downArrowPressed, leftArrowPressed, rightArrowPressed];

  const signs = [1, -1, -1, 1];

  for (let i = 0; i < buttons.length; i++) {
    let buttonPressed = buttons[i];
    let movementFunction = functionsArray[i];
    let sign = signs[i];
    let direction = movementDirections(velocity, steering)[i];
    if (isUndefined(direction) || isUndefined(buttonPressed) || isUndefined(movementFunction) || isUndefined(sign)) {
      continue
    }
    if (!buttonPressed && direction == 0) {
      continue;
    }
    direction = Math.abs(direction)
    let value: number;
    if (buttonPressed) {
      value = direction + step < 1 ? direction + step : 1;
    }
    else {
      value = direction - step > 0 ? direction - step : 0;
    }
    value = value == 0 ? value : sign * value
    movementFunction(value);
  }
}

type Config = {
  topic: undefined | string
  frequency: number
}

type Message = {
  header:
  {
    frame_id: string,
    stamp: {
      sec: number,
      nsec: number,
    },
  },
  mode: number | undefined,
  curvature_ratio: number,
  velocity_ratio: number,
};


function createMsg(frame_id: string, curvature: number, velocity: number, mode: number | undefined): Message {
  let date = new Date();
  return {
    header: {
      frame_id: frame_id,
      stamp: {
        sec: Math.floor(date.getTime() / 1000),
        nsec: date.getMilliseconds() * 1e+6,
      },
    },
    mode: mode,
    curvature_ratio: curvature,
    velocity_ratio: velocity
  };
};

function publish(context: any, currentTopic: any, msgRef: any, data: any, setMode: any) {
  const {mode, velocity, steering} = data
  if (isUndefined(mode)) {
    return;
  }
  console.log("publish", mode, velocity, steering);
  let date = new Date();
  msgRef.current.header.stamp.sec = Math.floor(date.getTime() / 1000);
  msgRef.current.header.stamp.nsec = date.getMilliseconds() * 1e+6;
  if (mode == 0) {
    msgRef.current.curvature_ratio = 0;
    msgRef.current.velocity_ratio = 0;
    setMode(() => undefined);
  }
  if (currentTopic && !validateTopic(currentTopic)) {
    // console.log("publish!!!");
    // context.publish?.(currentTopic, msgRef.current);
  }
}

const messageDataTypes = new Map([
  ["std_msgs/Header", ros2["std_msgs/Header"]],
  ["std_msgs/Float64", ros2["std_msgs/Float64"]],
  ["std_msgs/UInt8", ros2["std_msgs/UInt8"]],
  ["truck_msgs/msg/RemoteControl", {
    name: "truck_msgs/msg/RemoteControl",
    definitions: [
      { name: 'header', type: 'std_msgs/Header', isComplex: true, isArray: false },
      { name: 'mode', type: 'uint8', isComplex: false, isArray: false },
      { name: 'curvature_ratio', type: 'float64', isComplex: false, isArray: false },
      { name: 'velocity_ratio', type: 'float64', isComplex: false, isArray: false },
    ],
  }]
]);

function validateTopic(topic: string | undefined): string | undefined {
  if (topic == undefined) {
    return "Invalid topic";
  }
  if (topic.length > 0 && topic[0] == '/') {
    return undefined;
  }
  return "Invalid topic";
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
        error: validateTopic(config.topic)
      },
    },
  };

  return { general };
}

let controllers = new Map<number, Gamepad>();


const KeyboardControl = (props: any) => {
  // FIXME
  const {
    mode,
    setMode,
    locked, setLocked,
    setUpArrowPressed,
    setDownArrowPressed,
    setLeftArrowPressed,
    setRightArrowPressed,
    stopVehicle,
  } = props;

  const checkPressed = (eventCode: string, value: number) => {
    switch (eventCode) {
      case "ArrowUp":
        setUpArrowPressed(value)
        return;
      case "ArrowDown":
        setDownArrowPressed(value)
        return;
      case "ArrowLeft":
        setLeftArrowPressed(value)
        return;
      case "ArrowRight":
        setRightArrowPressed(value)
        return;
      default:
        return;
    }
  }
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    checkPressed(event.code, 1);
  }

  const handleKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
    checkPressed(event.code, 0);
  }

  const changeLockedState = () => {
    setLocked(!locked)
  }

  const LockControl = () => {
    return (
      <span tabIndex={0} onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} onBlur={stopVehicle}>
        <span onClick={changeLockedState}>
          {locked ? <LockTwoToneIcon fontSize="large" /> : <LockOpenTwoToneIcon fontSize="large" />}
        </span>
      </span>
    )
  }

  return (
    <div>
      <p style={{ background: "gradient", textAlign: "center" }}>
        <span>
          {/* {locked ? <FocusLock as="span"><LockControl/></FocusLock> : <LockControl/>} */}
        </span>
        <span style={{ marginLeft: "20px" }}>
          KOK
          <span onClick={() => { setMode(() => 0) }} style={{ marginRight: '20px' }}><SyncDisabledIcon sx={{ color: mode == 0 ? "red" : "disabled" }} fontSize="large" /></span>
          <span onClick={() => { setMode(() => 1) }}><LooksOneIcon sx={{ color: mode == 1 ? "green" : "disabled" }} fontSize="large" /></span>
          <span onClick={() => { setMode(() => 2) }}><LooksTwoIcon sx={{ color: mode == 2 ? "olive" : "disabled" }} fontSize="large" /></span>
          <span onClick={() => { setMode(() => 3) }}><Looks3Icon sx={{ color: mode == 3 ? "blue" : "disabled" }} fontSize="large" /></span>
        </span>
      </p>
    </div>
  )
}


function ControlButtonsPanel({ context }: { context: PanelExtensionContext }): JSX.Element {
  const frame_id = useRef<string>("base_link");
  const joystick_ref = createRef<HTMLDivElement>();

  const [velocity, _setVelocity] = useState<number>(0);
  const [steering, _setSteering] = useState<number>(0);
  const [mode, setMode] = useState<number | undefined>(undefined);
  // const [dimensions, setDimensions] = useState({ width: 1, height: 2 })

  const latestMsg = useRef<Message>(createMsg(frame_id.current, steering, velocity, mode));

  const setVelocity = (value: number) => {
    if ((velocity > 0 && value < 0) || (velocity < 0 && value > 0)) {
      _setVelocity(0);
      return;
    }
    _setVelocity(Math.round(value * 100) / 100);
  }

  const setSteering = (value: number) => {
    if ((steering > 0 && value < 0) || (steering < 0 && value > 0)) {
      _setSteering(0);
      return;
    }
    _setSteering(Math.round(value * 100) / 100);
  }

  const stopSteer = () => _setSteering(0);
  const stopMovement = () => _setVelocity(0);
  const stopVehicle = () => {
    _setVelocity(0);
    _setSteering(0);
  }

  const [upArrowPressed, setUpArrowPressed] = useState<number>(0);
  const [downArrowPressed, setDownArrowPressed] = useState<number>(0);
  const [leftArrowPressed, setLeftArrowPressed] = useState<number>(0);
  const [rightArrowPressed, setRightArrowPressed] = useState<number>(0);

  // const getPositionMessage = () => `{"rel_velocity": ${velocity}, "rel_curvature": ${steering}, "mode": 1}`;

  const [locked, setLocked] = useState<boolean>(true);

  const { saveState } = context;
  const [topics, setTopics] = useState<readonly Topic[]>([]);

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

  useEffect(() => {
    const tree = buildSettingsTree(config, topics);
    context.updatePanelSettingsEditor({
      actionHandler: settingsActionHandler,
      nodes: tree,
    });
    saveState(config);
  }, [config, context, saveState, settingsActionHandler, topics]);

  const [renderDone, setRenderDone] = useState<() => void>(() => () => { });

  useLayoutEffect(() => {
    context.onRender = (renderState, done) => {
      setTopics(renderState.topics ?? []);
      setRenderDone(() => done);
    };

    context.watch("topics");

    if (config.topic && !validateTopic(config.topic)) {
      console.log(ros2["sensor_msgs/Joy"]);
      console.log("DATATYPES:", messageDataTypes);
      context.advertise?.(config.topic, "truck_msgs/msg/RemoteControl", { messageDataTypes });
    }

  }, [context]);

  const { topic: currentTopic } = config;
  useEffect(
    () => {
      if (!currentTopic) {
        return
      }
      
      context.advertise?.(currentTopic, "truck_msgs/msg/RemoteControl", { messageDataTypes });
      return(
        () => {context.unadvertise?.(currentTopic);}
      )
    },
    [currentTopic]
  )

  useEffect(() => {
    connectGamePadControl({setVelocity, setSteering, stopVehicle})
  }, [])

  useInterval(
    () => {
      checkButtonns({locked, mode, velocity, steering},
                    {upArrowPressed, downArrowPressed, leftArrowPressed, rightArrowPressed},
                    {setVelocity, setSteering, stopMovement, stopSteer})
    },
    1
  )
  
  useEffect(() => {
    if (!mode) {
      _setSteering(0);
      _setVelocity(0);
    }
    latestMsg.current = createMsg(frame_id.current, steering, velocity, mode)
  }, [velocity, steering, mode])
  
  useInterval(
    () => {
      if (config.frequency <= 0) {
        return;
      }
      if (currentTopic && !validateTopic(currentTopic)) {
        publish(context, currentTopic, latestMsg, {mode, velocity, steering}, setMode);
      }
    },
    (1000) / config.frequency
  )

  useLayoutEffect(() => {
    renderDone();
  }, [renderDone]);


  const buttonTheme = createTheme({
    palette: {
      background: {
        active: "#212121",
        disabled: "#666666",
        lightGray: "#cfd2dd"
      },
      fill: {

      },
      gradient: "radial-gradient(circle, rgba(73,75,88,1) 30%, rgba(255,255,255,0.96) 100%)"
    }
  })

  // const dimensionsHook = useRefDimensions(joystick_ref, {dimensions, setDimensions});

  return (
    <ThemeProvider theme={buttonTheme}>
      <div style={{ marginTop: "2.5vh", marginBottom: "2.5vh" }}>
        <h2 style={{ textAlign: "center" }}>
          velocity: {velocity}, steering: {steering}, mode: {isUndefined(mode) ? 'not enabled' : mode}
        </h2>
        {/* <p>Dimensions: {dimensions.width}w {dimensions.height}h</p> */}
      </div>
      XXX: {mode}
      <KeyboardControl
        mode={mode}
        setMode={setMode}
        locked={locked}
        setLocked={setLocked}
        setUpArrowPressed={setUpArrowPressed}
        setDownArrowPressed={setDownArrowPressed}
        setLeftArrowPressed={setLeftArrowPressed}
        setRightArrowPressed={setRightArrowPressed}
        stopVehicle={stopVehicle}
      />
      <div id="joystick-area" style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px",
          gridAutoRows: "minmax(50px, auto)"
        }}
        ref={joystick_ref}>
        <div id="left-stick" style={{ gridRow: "2", gridColumn: "1" }}>
          <div style={{ width: "50%", margin: "auto" }}>
            <Joystick controlPlaneShape={JoystickShape.AxisY}
              baseColor="rgba(0, 0, 0, 0.3)"
              stickColor="rgba(0, 0, 0, 0.7)"
              pos={{ x: 0, y: velocity }}
              move={(event: IJoystickUpdateEvent) => {
                if (event.y) {
                  setVelocity(event.y)
                }
              }}
              // size={dimensions.width * 0.2}
              stop={() => setVelocity(0)}
            />
          </div>
        </div>
        <div id="right-stick" style={{ gridRow: "2", gridColumn: "2" }}>
          <div style={{ width: "50%", margin: "auto" }}>
            <Joystick controlPlaneShape={JoystickShape.AxisX}
              baseColor="rgba(0, 0, 0, 0.3)"
              stickColor="rgba(0, 0, 0, 0.7)"
              pos={{ x: steering, y: 0 }}
              move={(event: IJoystickUpdateEvent) => {
                if (event.x) {
                  setSteering(event.x)
                }
              }}
              // size={dimensions.width * 0.2}
              stop={() => setSteering(0)}
            />
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

export function initControlButtonsPanel(context: PanelExtensionContext): () => void {
  ReactDOM.render(<ControlButtonsPanel context={context} />, context.panelElement);

  return () => {
    ReactDOM.unmountComponentAtNode(context.panelElement);
  };
}
