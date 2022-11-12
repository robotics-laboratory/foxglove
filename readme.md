# Foxglove Tools

## Overview

This repository contains various plugins and utilities for the [foxglove studio](https://foxglove.dev/) visualization platform:

- **Foxglove Injector** &mdash; patched web version of foxglove that allows to automatically install *.foxe extensions from docker mount. It even works on mobile devices, where drag-and-drop feature is often unavailable.
- **H.264 Stream Panel** &mdash; live video panel for the [truck](https://github.com/robotics-laboratory/truck) project, based on [h264-live-player](https://github.com/131/h264-live-player) on frontend and [GStreamer + Nvidia Hardware Acceleration](https://developer.download.nvidia.com/embedded/L4T/r32_Release_v1.0/Docs/Accelerated_GStreamer_User_Guide.pdf) on backend.

## Running

Select one of the following commands that matches your architecture.

```
docker compose up foxglove-amd64  # amd64
docker compose up foxglove-arm64  # arm64/v8 (aarch64)
docker compose up foxglove-$(dpkg --print-architecture)  # auto-detect
```

## Building

To build for multiple architectures, use [docker buildx](https://docs.docker.com/build/building/multi-platform/). To test image locally before pushing, replace `--push` flag with `--load`.

```
docker buildx bake -f docker-compose.yml --push
```


