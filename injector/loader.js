var __injector_loaded = false;

window.__injector_callback = async () => {
    if (__injector_loaded) return;
    __injector_loaded = true;

    let result = await (await fetch("/extensions.txt")).text();
    let count = 0;
    for (let name of result.split("\n")) {
        if (!name) continue;
        console.log("Loading extension:", name);
        let data = await window.__injector_downloadExtension(`/${name}`);
        window.__injector_installExtension("local", data);
        count += 1;
    }

    alert(`Auto-loaded ${count} extensions`);
};
