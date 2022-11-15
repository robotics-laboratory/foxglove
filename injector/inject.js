// Foxglove uses showOpenFilePicker, which is unimplemented on mobile devices
import { showOpenFilePicker } from 'https://cdn.jsdelivr.net/npm/file-system-access/lib/es2018.js'
window.showOpenFilePicker = showOpenFilePicker;

// Automatically installs all custom .foxe extensions from the server
var __injector_loaded = false;
window.__injector_callback = async () => {
    if (__injector_loaded) return;
    __injector_loaded = true;

    let result = await (await fetch("/extensions.txt")).text();
    let count = 0;
    for (let name of result.split("\n")) {
        if (!name) continue;
        console.log("[injector] Loading extension:", name);
        let data = await window.__injector_downloadExtension(`/${name}`);
        window.__injector_installExtension("local", data);
        count += 1;
    }

    console.log(`[injector] Auto-loaded ${count} extensions`);
};
