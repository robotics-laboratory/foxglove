import { PanelExtensionContext, RenderState } from "@foxglove/studio";
import { useLayoutEffect, useRef } from "react";
import { useResizeDetector } from "react-resize-detector";
import ReactDOM from "react-dom";

const stateTopic = "/cartpole/state";
const historySize = 100;

type CartPoleState = {
    pos: number;
    angle: number;
}

function getCurrentState(renderState: RenderState): CartPoleState | null {
    if (!renderState.currentFrame) return null;
    const packets = renderState.currentFrame.filter((e) => e.topic === stateTopic);
    const messages = packets.map((e) => e.message).filter(Boolean);
    if (!messages.length || !messages[0]) return null;
    const msg = messages[0] as any;
    return {
        pos: msg.cart_position / 0.3,  // TODO: Use max width from settings
        angle: msg.pole_angle % (2 * Math.PI),
    };
};

function CartPolePanel({ context }: { context: PanelExtensionContext }): JSX.Element {
    const canvas = useRef<HTMLCanvasElement | null>(null);
    const container = useRef<HTMLDivElement | null>(null);
    const context2d = useRef<CanvasRenderingContext2D | null>(null);
    const stateHistory = useRef<CartPoleState[]>([]);
    
    const { width, height } = useResizeDetector({
        refreshRate: 0,
        refreshMode: "debounce",
        targetRef: container,
    });
    
    useLayoutEffect(() => {
        context.onRender = (renderState: RenderState, done) => {
            if (!context2d.current || !width || !height) return done();

            const ctx = context2d.current;
            const midX = width / 2;
            const midY = height / 2;
            const railBorderSize = 40;
            const cartSize = 80;
            const cartRange = width - 200;
            const strokeColor = "#505050"
            const cartColor = "#e37209";
            const trajectoryColor = "red";
            ctx.clearRect(0, 0, width, height);
            ctx.globalAlpha = 1;

            // Draw rail with borders
            ctx.beginPath();
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 2;
            ctx.moveTo(midX - cartRange / 2, midY);
            ctx.lineTo(midX + cartRange / 2, midY);
            ctx.moveTo(midX - cartRange / 2, midY - railBorderSize / 2);
            ctx.lineTo(midX - cartRange / 2, midY + railBorderSize / 2);
            ctx.moveTo(midX + cartRange / 2, midY - railBorderSize / 2);
            ctx.lineTo(midX + cartRange / 2, midY + railBorderSize / 2);
            ctx.stroke();
            
            const state = getCurrentState(renderState);
            if (!state) return done();
            const history = stateHistory.current;
            history.unshift(state);
            if (history.length > historySize) history.length = historySize;
            
            const getPoleEndPoint = (state: CartPoleState): [number, number] => {
                const cartCenter = midX + state.pos * (cartRange - cartSize) / 2;
                const x = cartCenter + Math.cos(state.angle - Math.PI / 2) * poleLength;
                const y = midY - Math.sin(state.angle - Math.PI / 2) * poleLength;
                return [x, y];
            };

            // Draw cart & pole
            const poleLength = 200;
            const cartCenter = midX + state.pos * (cartRange - cartSize) / 2;
            const cartBorderRadius = 10;
            ctx.beginPath();
            ctx.strokeStyle = "transparent";
            ctx.fillStyle = cartColor;
            (ctx as any).roundRect(
                cartCenter - cartSize / 2,
                midY - cartSize / 2,
                cartSize,
                cartSize,
                cartBorderRadius,
            )
            ctx.fill();
            ctx.beginPath();
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 10;
            ctx.moveTo(cartCenter, midY);
            ctx.lineTo(...getPoleEndPoint(state));
            ctx.stroke();
            ctx.beginPath();
            ctx.fillStyle = strokeColor;
            ctx.arc(cartCenter, midY, 15, 0, 2 * Math.PI);
            ctx.fill();

            if (history.length < 2) return done();
            
            // Draw trajectory
            let prevPoint = getPoleEndPoint(history[0] as CartPoleState);
            history.slice(1).forEach((state, i) => {
                let currPoint = getPoleEndPoint(state);
                ctx.beginPath();
                ctx.strokeStyle = trajectoryColor;
                ctx.lineWidth = 2;
                ctx.globalAlpha = 1 - i / historySize;
                ctx.moveTo(...prevPoint);
                ctx.lineTo(...currPoint);
                ctx.stroke();
                prevPoint = currPoint;
            });

            done();
        };

        context.watch("currentFrame");
        context.subscribe([stateTopic]);
        context2d.current = canvas.current?.getContext("2d") || null;
    }, [context, width, height]);

    return <div className="cartpole-panel">
        <div className="wrapper" ref={container}>
            <canvas width={width} height={height} ref={canvas}></canvas>
        </div>
    </div>;
}

export function initCartPolePanel(context: PanelExtensionContext): void {
    ReactDOM.render(<CartPolePanel context={context} />, context.panelElement);
}
