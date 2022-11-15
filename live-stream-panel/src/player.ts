import { WSAvcPlayer } from "ts-h264-live-player";
import { EventEmitter } from "events";

// https://github.com/TeaFlex/ts-h264-live-player/tree/master/src/canvas
const canvasMode = "YUVWebGLCanvas";

export class Player extends EventEmitter {
    player: WSAvcPlayer;
    websocket?: WebSocket;
    connected: boolean = false;

    constructor(canvas: unknown) {
        super();
        this.player = new WSAvcPlayer(canvas as HTMLCanvasElement, canvasMode);
    }

    start(url: string) {
        let lastPlayer = (window as any).__current_stream_player;
        if (lastPlayer) lastPlayer.stop();
        try {
            (window as any).__current_stream_player = this;
            this.websocket = new WebSocket(url);
            this.websocket.binaryType = "arraybuffer";
            this.websocket.addEventListener("open", this.onopen.bind(this));
            this.websocket.addEventListener("error", this.onerror.bind(this));
            this.websocket.addEventListener("close", this.onerror.bind(this));
            this.player.connectWithCustomClient(this.websocket);
        } catch (_) {}
    }

    stop() {
        this.player.disconnect();
        this.connected = false;
        this.emit("stop");
    }

    onopen(e: any) {
        if (e.target.readyState !== WebSocket.OPEN) return;
        this.player.send("REQUESTSTREAM");
        this.connected = true;
        this.emit("open");
    }

    onerror() {
        this.stop();
        this.emit("error");
    }
};
