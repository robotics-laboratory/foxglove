import { PanelExtensionContext, SettingsTreeAction, SettingsTreeNode, SettingsTreeNodes, Topic } from "@foxglove/studio"
import { MouseEventHandler, TouchEventHandler, useCallback, useEffect, useLayoutEffect, useState } from "react";
import ReactDOM from "react-dom";
import FocusLock from "react-focus-lock";
import _ from "lodash";

import { JoystickManagerOptions, Position } from "nipplejs";
import nipplejs from "nipplejs";

import Gamepad from "react-gamepad" ;

import { createTheme, ThemeProvider } from "@mui/system";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import LockOpenTwoToneIcon from "@mui/icons-material/LockOpenTwoTone";
import LockTwoToneIcon from "@mui/icons-material/LockTwoTone";

import KeyboardAltOutlinedIcon from "@mui/icons-material/KeyboardAltOutlined";
import TouchAppOutlinedIcon from "@mui/icons-material/TouchAppOutlined";
import SportsEsportsOutlinedIcon from "@mui/icons-material/SportsEsportsOutlined";

import { SvgIconTypeMap } from "@mui/material";
import { OverridableComponent } from "@mui/material/OverridableComponent";


interface ArrowOptions {
  Icon: OverridableComponent<SvgIconTypeMap> & { muiName: string }
  row: string
  col: string
  is_active: Function
  mouseDownHandler: MouseEventHandler<HTMLDivElement>
  mouseUpHandler: MouseEventHandler<HTMLDivElement>
  touchStartHandler: TouchEventHandler<HTMLDivElement>
  touchEndHandler: TouchEventHandler<HTMLDivElement>
}

type Config = {
  topic: undefined | string
  frequency: number
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

function ControlButtonsPanel({ context }: { context: PanelExtensionContext }): JSX.Element {
  
  const [velocity, setVelocity] = useState<number>(0);
  const [steering, setSteering] = useState<number>(0);

  const moveForward = () => velocity < 0 ? setVelocity(0) :setVelocity(1);
  const moveBackward = () => velocity > 0 ? setVelocity(0) :setVelocity(-1);
  const steerLeft = () => steering > 0 ? setSteering(0) : setSteering(-1);
  const steerRight = () => steering < 0 ? setSteering(0) : setSteering(1);
  const stopSteer = () => setSteering(0);
  const stopMovement = () => setVelocity(0);

  const stopVehicle = () => {
    stopMovement();
    stopSteer();
  }

  const getPositionMessage = () => `"velocity": ${velocity}, "steering": ${steering}`;

  const [gamepadState, setGamepadState] = useState<string>("No devices available. Connect a gamepad and press any key on it");
  const [chosenControlOption, setChosenControllOption] = useState<number[]>([1, 0, 0]);
  const [locked, setLocked] = useState<boolean>(false);

  const ControlOptionsBar = () => {
    
    const activeControllerOptionStyle = (index: number) =>(
      {
        borderBottom: chosenControlOption[index] ? "2px solid black" : "none",
        background: chosenControlOption[index] ? "radial-gradient(ellipse at bottom, rgba(130,132,139,0.6026785714285714) 10%, rgba(255,255,255, 0) 68%)" : "none",
        padding: "1vh",
        cursor: "pointer"
      }
    )

    const changeActiveControllerOption = (index: number) => {
      setLocked(false);
      let temp = [0, 0, 0];
      temp[index] = 1;
      setChosenControllOption(temp);
    }

    return (
      <div>
        <p style={{ background: "gradient", textAlign: "center" }}>
          <span style={activeControllerOptionStyle(0)} onClick={() => changeActiveControllerOption(0)}>
            <KeyboardAltOutlinedIcon fontSize="large"/>
          </span>
          <span  style={activeControllerOptionStyle(1)} onClick={() => changeActiveControllerOption(1)}>
            <TouchAppOutlinedIcon fontSize="large"/>
          </span>
          <span  style={activeControllerOptionStyle(2)} onClick={() => changeActiveControllerOption(2)}>
            <SportsEsportsOutlinedIcon fontSize="large"/>
          </span>
          
        </p>
      </div>
    )
  }

  
  const KeyboardController = () => {
    
    const GridButton = ({ Icon, row, col, is_active,
                          mouseDownHandler, mouseUpHandler,
                          touchStartHandler, touchEndHandler } : ArrowOptions) => (
      <div style={{ gridRow: row, gridColumn: col }}
                    onMouseDown={mouseDownHandler} onMouseUp={mouseUpHandler}
                    onMouseLeave={mouseUpHandler}
                    onTouchStart={touchStartHandler}
                    onTouchEnd={touchEndHandler}>
      <Icon fontSize="large"
            sx={{ 
            color: "white",
            backgroundColor: is_active() ? "background.active" : "background.disabled" 
            }} />
      </div>
      )
    
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      switch (event.code) {
        case "ArrowUp":
          moveForward();
          return;
        case "ArrowDown":
          moveBackward();
          return;
        case "ArrowLeft":
          steerLeft();
          return;
        case "ArrowRight":
          steerRight();
          return;
        default:
          return;
      }
    }

    const handleKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
      switch (event.code) {
        case "ArrowUp" || "ArrowDown":
          stopMovement();
          return;
        case "ArrowDown":
          stopMovement();
          return;
        case "ArrowLeft" || "ArrowRight":
          stopSteer();
          return;
        case "ArrowRight":
          stopSteer();
          return;
        default:
          return;
      }
    }

    const changeLockedState = () => {
      setLocked(!locked);
    }
    
    const LockControl = () => (
      <div>
        <input type="text" style={{opacity: 0}}
               onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}/>
        <div onClick={ changeLockedState }>
          {locked ? <LockTwoToneIcon/> : <LockOpenTwoToneIcon/>}
        </div>
      </div>
    )

    return (
      <div style={{display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: "5px",
                    gridAutoRows: "minmax(50px, auto)", maxWidth: "20vw", marginTop: "10vh"}}>
          <div style={{gridRow: "2", gridColumn: "7"}}>
            {locked ? <FocusLock><LockControl/></FocusLock> : <LockControl/>}
          </div>

          <GridButton Icon={ArrowUpwardIcon} row="3" col="5"
                      is_active={() => velocity > 0}
                      mouseDownHandler={moveForward}
                      mouseUpHandler={stopVehicle}
                      touchStartHandler={moveForward}
                      touchEndHandler={stopMovement}/>
          <GridButton Icon={ArrowBackIcon} row="4" col="4"
                      is_active={() => steering < 0}
                      mouseDownHandler={steerLeft}
                      mouseUpHandler={stopVehicle}
                      touchStartHandler={steerLeft}
                      touchEndHandler={stopSteer}/>
          <GridButton Icon={ArrowDownwardIcon} row="4" col="5" 
                      is_active={() => velocity < 0}
                      mouseDownHandler={moveBackward}
                      mouseUpHandler={stopVehicle}
                      touchStartHandler={moveBackward}
                      touchEndHandler={stopMovement}/>
          <GridButton Icon={ArrowForwardIcon} row="4" col="6" 
                      is_active={() => steering > 0}
                      mouseDownHandler={steerRight}
                      mouseUpHandler={stopVehicle}
                      touchStartHandler={steerRight}
                      touchEndHandler={stopSteer}/>
        </div>
    )
  }

  const GamePadController = () => {
    
    const connectHandler = () => {
      setGamepadState("Gamepad connected. Use l-stick to control the robot and RT (R2 on dualshock) to stop");
    }

    const disconnectHandler = () => {
      setGamepadState("No devices available. Connect a gamepad and press any key on it");
    }
    
    const axisChangeHandler = (axisName: string, value: number) => {
      if (axisName == "LeftStickX") {
        setSteering(Math.round(value * 100) / 100);
      }
      if (axisName == "LeftStickY") {
        setVelocity(Math.round(value * 100) / 100);
      }
    }
    
    return (
      <div style={{ marginTop: "10vh"}}>
        <Gamepad 
                //  stickThreshold={0.25}
                //  deadZone={0.2}
                 onConnect={connectHandler}
                 onDisconnect={disconnectHandler}
                 onAxisChange={axisChangeHandler}
                 onRT={stopVehicle}>
          <main></main>
        </Gamepad>
        <h2>{gamepadState}</h2>
      </div>
      
    )
  }


  let startPoint: Position;
  let manager: nipplejs.JoystickManager;

  const initNipple = (colorScheme: string) => {
    const zone = document.getElementById("nipple_zone") as HTMLDivElement;
    const size = document.body.offsetWidth * 0.2;
    let options: JoystickManagerOptions = {
      zone: zone,
      color: (colorScheme === "light" ? "black" : "white"),
      size: size,
      restOpacity: 0.8,
      mode: "static",
      dynamicPage: true,
       position: { left: "50%", top: "60%" },
    };
    
    manager = nipplejs.create(options);
    manager.on("start", (evt, data) => {
      console.log(evt);
      startPoint = data.position;
    })

    manager.on("move", (evt, data) => {
      console.log(evt);
      let x = -(startPoint.x - data.position.x) / (0.5 * size);
      let y = (startPoint.y - data.position.y) / (0.5 * size);
      setVelocity(Math.round(y * 100) / 100);
      setSteering(Math.round(x * 100) / 100);
    })

    manager.on("end", () => {
      stopVehicle();
    })

    return true;
  }
  
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

  const [renderDone, setRenderDone] = useState<() => void>(() => () => {});
  useLayoutEffect(() => {
    context.watch("topics");
    initNipple("light");
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
    return;
  }, [context, config, currentTopic]);

  useLayoutEffect(() => {
    renderDone();
  }, [renderDone]);


  const buttonTheme = createTheme({
    palette:{
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

  return (
    <ThemeProvider theme={buttonTheme}>
      <div style={{ marginTop: "2.5vh", marginBottom: "2.5vh" }}>
        <h2 style={{ textAlign: "center" }}>
          { getPositionMessage() }
        </h2>
      </div>
      <ControlOptionsBar/>
      
      <div style={{margin: "auto", width: "50%"}}>
        {!!chosenControlOption[0] && <KeyboardController/>}
        <div id="nipple_zone" hidden={!chosenControlOption[1]}></div>
        {!!chosenControlOption[2] && <GamePadController/>}
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
