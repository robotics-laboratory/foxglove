# Foxglove Tools

## Overview

This repository contains various plugins and utilities for the [foxglove studio](https://foxglove.dev/) visualization platform:

- **Foxglove Web** &mdash; web version of foxglove with some QOL patches
- **Video Stream Panel** &mdash; live video panel for the [truck](https://github.com/robotics-laboratory/truck) project

## Running

Select one of the following commands that matches your architecture:

```
docker compose up --no-build foxglove-amd64  # amd64
docker compose up --no-build foxglove-arm64  # arm64/v8 (aarch64)
```

Navigate to [http://localhost:8080/]() to open foxglove web interface.

## Building

To build for multiple architectures, use [docker buildx](https://docs.docker.com/build/building/multi-platform/). To test image locally before pushing, replace `--push` flag with `--load`.

```
docker buildx bake -f docker-compose.yml --push
```
