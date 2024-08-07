import { PanelExtensionContext, SettingsTreeAction, SettingsTreeNode, SettingsTreeNodes, Topic } from "@foxglove/studio"
import { ros2humble as ros2 } from "@foxglove/rosmsg-msgs-common";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import _ from "lodash";

import { Joystick, JoystickShape } from "react-joystick-component"
import { IJoystickUpdateEvent } from "react-joystick-component/build/lib/Joystick";
import { useResizeDetector } from "react-resize-detector";
import { useInterval } from 'usehooks-ts'
import { Button, styled as muiStyled } from '@mui/material';

declare global {
  interface Window {
    controlPanelsCount: number;
  }
}

window.controlPanelsCount = 0;

const getSign = (value: number) => value > 0 ? "+" : ""

const connectGamePadControl = (movementFunctions: any, setMode: any, deadZoneRef: any, isGamepadEnabledRef: any) => {
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
    if (deadZoneRef.current != undefined && isGamepadEnabledRef.current) {
      if (y) {
        setVelocity(Math.abs(y) > deadZoneRef.current ? -y : 0 )
      }
      if (x) {
        setSteering(Math.abs(x) > deadZoneRef.current ? -x : 0)
      }

      let buttons = controller?.buttons
      if (buttons) {
        if (buttons[0]?.value == 1) {
          // console.log("X pressed")
          setMode(1)
        }
        if (buttons[1]?.value == 1) {
          // console.log("Circle pressed")
          setMode(2)
        }
        if (buttons[2]?.value == 1) {
          // console.log("Square pressed")
          setMode(0)
        }
        if (buttons[3]?.value == 1) {
          console.log("Triangle pressed")
        }
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
                                                                    steering >= 0 ? steering : undefined, steering <= 0 ? steering : undefined];

function checkButtonns(panelData: any, buttonsData: any, movementFunctions: any) {
  const {isKeyboardEnabled, mode, velocity, steering} = panelData;
  const {upArrowPressed, downArrowPressed, leftArrowPressed, rightArrowPressed} = buttonsData;
  const {setVelocity, setSteering, stopMovement, stopSteer} = movementFunctions;
  const functionsArray = [setVelocity, setVelocity, setSteering, setSteering]
  if (isKeyboardEnabled() && mode) {
    const step = 0.05;
    if ((upArrowPressed && downArrowPressed) || (upArrowPressed && velocity < 0) || (downArrowPressed && velocity > 0)) {
      stopMovement();
    }
    if ((leftArrowPressed && rightArrowPressed) || (leftArrowPressed && steering < 0) || (rightArrowPressed && steering > 0)) {
      stopSteer();
    }
  
    const buttons = [upArrowPressed, downArrowPressed, leftArrowPressed, rightArrowPressed];
  
    const signs = [1, -1, 1, -1];
  
    for (let i = 0; i < buttons.length; i++) {
      let buttonPressed = buttons[i];
      let movementFunction = functionsArray[i];
      let sign = signs[i]!;
      let direction = movementDirections(velocity, steering)[i];
      if (direction == undefined || buttonPressed == undefined || movementFunction == undefined || sign == undefined) {
        continue
      }
      if (!buttonPressed && direction == 0) {
        continue;
      }
      direction = Math.abs(direction!)
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
}

type Config = {
  topic: undefined | string
  frequency: number
  gamepadDeadZone: number
  controlMode: number
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


function createMsg(frame_id: string, curvature: number, velocity: number, mode: number | undefined, offset: number): Message {
  let date = new Date(Date.now() - (offset * 1000));
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

function publish(context: any, currentTopic: any, msgRef: any, data: any) {
  const {mode, offset} = data
  let date = new Date(Date.now() - (offset * 1000));
  msgRef.current.header.stamp.sec = Math.floor(date.getTime() / 1000);
  msgRef.current.header.stamp.nsec = date.getMilliseconds() * 1e+6;
  if (mode == 0) {
    msgRef.current.mode = 0;
    msgRef.current.curvature_ratio = 0;
    msgRef.current.velocity_ratio = 0;
  }
  if (currentTopic && !validateTopic(currentTopic)) {
    // context.advertise?.(currentTopic, "truck_msgs/msg/RemoteControl", { datatypes: messageDataTypes });
    context.publish?.(currentTopic, msgRef.current);
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
      controlMode: { 
        label: "Control mode",
        input: "select",
        value: config.controlMode,
        options: [
          {label: "Keyboard", value: 0, disabled: false},
          {label: "Joystick", value: 1, disabled: true},
          {label: "Gamepad", value: 2, disabled: true}
        ] 
      },
      frequency: { 
        label: "Frequency",
        input: "number", 
        value: config.frequency, 
        min: 1, 
        max: 60
      },
      gamepadDeadZone: {
        label: "Gamepad dead zone",
        input: "number", 
        value: config.gamepadDeadZone, 
        min: 0, 
        max: 1, 
        step: 0.05 
      },
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

  const {
    isKeyboardEnabled,
    setUpArrowPressed,
    setDownArrowPressed,
    setLeftArrowPressed,
    setRightArrowPressed,
    setMode
  } = props;

  const checkPressed = (event: KeyboardEvent, value: number) => {
    let eventCode = event.code
    if (eventCode == "ArrowUp" || eventCode == "KeyW") {
      setUpArrowPressed(value)
    }
    else if (eventCode == "ArrowDown" || eventCode == "KeyS") {
      setDownArrowPressed(value)
    }
    else if (eventCode == "ArrowLeft" || eventCode == "KeyA") {
      setLeftArrowPressed(value)
    }
    else if (eventCode == "ArrowRight" || eventCode == "KeyD") {
      setRightArrowPressed(value)
    }

    if (event.shiftKey && event.code == "Digit1") {
      setMode(0)
    } else if (event.shiftKey && event.code == "Digit2") {
      setMode(1)
    } else if (event.shiftKey && event.code == "Digit3") {
      setMode(2)
    }
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isKeyboardEnabled()) {
      return
    }
    checkPressed(event, 1);
  }
  const handleKeyUp = (event: KeyboardEvent) => {
    if (!isKeyboardEnabled()) {
      return
    }
    checkPressed(event, 0);
  }

  // adds & removes keyboard event listeners
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return(()=> {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    })
  }, [isKeyboardEnabled])

  return (<></>)
}

const StyledButton = muiStyled(Button, {
  shouldForwardProp: (prop) => prop !== "buttonColor",
})<{ buttonColor?: string }>(({ theme, buttonColor, variant }) => {
  if (buttonColor == undefined) return {};
  const augColor = theme.palette.augmentColor({color: { main: buttonColor }});
  if (variant == "contained") {
    return {
      backgroundColor: augColor.main,
      color: augColor.contrastText,
      borderColor: augColor.main,
      "&:hover": { backgroundColor: augColor.dark },
    };
  } else {
    return {
      backgroundColor: "transparent",
      color: augColor.main,
      borderColor: augColor.main,
    };
  }
});

function ModeButton(props: any): JSX.Element {
  const {label, modeValue, truckMode, setMode} = props;
  const colors = ["#e34b4b", "#1590e8", "#26d83e"];
  return (
    <StyledButton
      size="medium"
      variant={truckMode == modeValue ? "contained" : "outlined"}
      buttonColor={colors[modeValue]}
      onClick={()=>{setMode(modeValue)}}
      style={{minWidth: "5rem", boxShadow: "none"}}
    >
      { label }
    </StyledButton>
  )
}

function ModesSwitcher(props: any): JSX.Element {
  const {mode, truckMode, setMode} = props;
  return (
    <div style={{ display: "flex", flexDirection: "row", gap: "0.5rem",
                  margin: "auto", paddingTop: "3rem", 
                  justifyContent: "center", alignItems: "center" }}>
      <ModeButton label="OFF" modeValue={0} panelMode={mode} truckMode={truckMode} setMode={setMode} />
      <ModeButton label="REMOTE" modeValue={1} panelMode={mode} truckMode={truckMode} setMode={setMode} />
      <ModeButton label="AUTO" modeValue={2} panelMode={mode} truckMode={truckMode} setMode={setMode} />
    </div>
  )
}


function ControlButtonsPanel({ context }: { context: PanelExtensionContext }): JSX.Element {
  
  const frame_id = useRef<string>("base_link");
  
  const [velocity, _setVelocity] = useState<number>(0);
  const setVelocity = (value: number) => {
    if ((velocity > 0 && value < 0) || (velocity < 0 && value > 0)) {
      _setVelocity(0);
      return;
    }
    _setVelocity(Math.round(value * 100) / 100);
  }

  const [steering, _setSteering] = useState<number>(0);
  const setSteering = (value: number) => {
    if ((steering > 0 && value < 0) || (steering < 0 && value > 0)) {
      _setSteering(0);
      return;
    }
    _setSteering(Math.round(value * 100) / 100);
  }
  
  const [mode, _setMode] = useState<number>(0);
  const setMode = (newMode: number) => {
    _setMode(() => newMode)
    if (newMode == 0) {
      _setVelocity(0);
      _setSteering(0);
      publish(context, currentTopic, latestMsg, {mode: 0, offset, velocity, steering});
    }
  }
  const [truckMode, setTruckMode] = useState<number>(0)
  
  const [offset, setOffset] = useState<number>(0)
  const latestMsg = useRef<Message>(createMsg(frame_id.current, steering, velocity, mode, offset));
  
  const stopSteer = () => _setSteering(0);
  const stopMovement = () => _setVelocity(0);
  const stopVehicle = () => {
    _setVelocity(0);
    _setSteering(0);
    setMode(0);
  }

  const [upArrowPressed, setUpArrowPressed] = useState<number>(0);
  const [downArrowPressed, setDownArrowPressed] = useState<number>(0);
  const [leftArrowPressed, setLeftArrowPressed] = useState<number>(0);
  const [rightArrowPressed, setRightArrowPressed] = useState<number>(0);

  const [topics, setTopics] = useState<readonly Topic[]>([]);
  
  const [config, setConfig] = useState<Config>(() => {
    const partialConfig = context.initialState as Partial<Config>;
    const {
      topic = "/control/input",
      frequency = 60,
      gamepadDeadZone = 0.05,
      controlMode = 0
    } = partialConfig;
    return {
      topic,
      frequency,
      gamepadDeadZone,
      controlMode
    };
  });

  const [renderDone, setRenderDone] = useState<() => void>(() => () => { });
  
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

  const { saveState } = context;
  const { topic: currentTopic, controlMode: controlMode, gamepadDeadZone: deadZone } = config;

  const isKeyboardEnabled = () => controlMode == 0
  const isJoystickEnabled = () => controlMode == 1
  const isGamepadEnabledRef = useRef<boolean>(controlMode == 2)

  const deadZoneRef = useRef<number>(deadZone)
  
  useEffect(() => {
    isGamepadEnabledRef.current = controlMode == 2
  }, [controlMode])

  useEffect(()=> {
    deadZoneRef.current = deadZone
  }, [deadZone])

  // adds onBlur events
  useEffect(() => {
    window.addEventListener("blur", stopVehicle)
    return (() => {
      window.removeEventListener("blur", stopVehicle)
    })
  })

  // updates setting trees
  useEffect(() => {
    const tree = buildSettingsTree(config, topics);
    context.updatePanelSettingsEditor({
      actionHandler: settingsActionHandler,
      nodes: tree,
    });
    saveState(config);
  }, [config, context, saveState, settingsActionHandler, topics]);

  // subscribes to topic from ROS to synchronize time
  useLayoutEffect(() => {
    context.onRender = (renderState, done) => {
      // console.log(renderState.currentFrame);
      if (renderState.currentFrame) {
        const { receiveTime, message } = (renderState.currentFrame.slice(-1).pop()) as any
        setOffset(receiveTime.sec - message.header.stamp.sec + ((receiveTime.nsec - message.header.stamp.nsec) / 1e9))
        setTruckMode(message.mode)
      }
      setTopics(renderState.topics ?? []);
      setRenderDone(() => done);
    };

    context.watch("topics");
    context.watch("currentFrame");
    context.subscribe([{topic: "/control/mode"}]);
    

  }, [context]);
  
  // advertises to a new topic
  useEffect(
    () => {
      if (!currentTopic) {
        return
      }
      context.advertise?.(currentTopic, "truck_msgs/msg/RemoteControl", { datatypes: messageDataTypes });
    },
    [currentTopic]
  )
  
  // starts listening to a gamepad
  useEffect(() => {
    connectGamePadControl({setVelocity, setSteering, stopVehicle}, setMode, deadZoneRef, isGamepadEnabledRef)
  }, [])

  // checks keyboard buttons
  useInterval(
    () => {
      checkButtonns({isKeyboardEnabled, mode, velocity, steering},
                    {upArrowPressed, downArrowPressed, leftArrowPressed, rightArrowPressed},
                    {setVelocity, setSteering, stopMovement, stopSteer})
    },
    1
  )

  // updates message data
  useEffect(() => {
    latestMsg.current = createMsg(frame_id.current, steering, velocity, mode, offset)
  }, [velocity, steering, mode])
  
  // publishes messages with particular frequency
  useInterval(
    () => {
      if (config.frequency <= 0) {
        return;
      }
      if (currentTopic && !validateTopic(currentTopic) && mode) {
        publish(context, currentTopic, latestMsg, {mode, offset, velocity, steering});
      }
    },
    (1000) / config.frequency
  )

  useLayoutEffect(() => {
    renderDone();
  }, [renderDone]);

  const container = useRef<HTMLDivElement | null>(null);
  const { width, height } = useResizeDetector({
      refreshRate: 0,
      refreshMode: "debounce",
      targetRef: container,
  });

  return (
    <>
      <div ref={container}>
        <KeyboardControl
          mode={mode}
          truckMode={truckMode}
          isKeyboardEnabled={isKeyboardEnabled}
          setUpArrowPressed={setUpArrowPressed}
          setDownArrowPressed={setDownArrowPressed}
          setLeftArrowPressed={setLeftArrowPressed}
          setRightArrowPressed={setRightArrowPressed}
          stopVehicle={stopVehicle}
          setMode={setMode}
        />
        <ModesSwitcher
          mode={mode}
          truckMode={truckMode}
          setMode={setMode}
        />
        <div style={{ width: "100%", paddingTop: `${height ? height * 0.1 : 0}px`,
                      display: "flex", flexDirection: "row", gap: `${width ? width * 0.2 : 0}px`,
                      justifyContent: "center", textAlign: "center" }}
            ref={container}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{margin: "auto", paddingBottom: `${height ? height * 0.1 : 0}px`}}>
              <p>VELOCITY</p>
              <p>{getSign(velocity)}{velocity}</p>
            </div>
            <Joystick controlPlaneShape={JoystickShape.AxisY}
              baseColor="rgba(0, 0, 0, 0.3)"
              stickColor="rgba(0, 0, 0, 0.7)"
              pos={{ x: 0, y: velocity }}
              move={(event: IJoystickUpdateEvent) => {
                if ( isJoystickEnabled() && event.y) {
                  setVelocity(event.y)
                }
              }}
              size={width ? width * 0.2 : 0}
              stop={() => setVelocity(0)}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{margin: "auto", paddingBottom: `${height ? height * 0.1 : 0}px`}}>
              <p>STEERING</p>
              <p>{getSign(steering)}{steering}</p>
            </div>
            <Joystick controlPlaneShape={JoystickShape.AxisX}
              baseColor="rgba(0, 0, 0, 0.3)"
              stickColor="rgba(0, 0, 0, 0.7)"
              pos={{  x: -steering, y: 0 }}
              move={(event: IJoystickUpdateEvent) => {
                if ( isJoystickEnabled() && event.x) {
                  setSteering(-event.x)
                }
              }}
              size={width ? width * 0.2 : 0}
              stop={() => setSteering(0)}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export function initControlButtonsPanel(context: PanelExtensionContext): () => void {
  if (window.controlPanelsCount == 0) {
    ReactDOM.render(<ControlButtonsPanel context={context} />, context.panelElement);
    window.controlPanelsCount++;
  } else {
    alert("There is already a control panel mounted")
    throw Error("There is already a control panel mounted")
  }

  return () => {
  window.controlPanelsCount--;
  ReactDOM.unmountComponentAtNode(context.panelElement);
  };
}
