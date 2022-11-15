# Source: https://github.com/foxglove/studio/blob/main/Dockerfile
ARG ARCH="linux/amd64"

FROM --platform=linux/amd64 node:16 as foxglove-base
ARG FOXGLOVE_REPO_URL="https://github.com/foxglove/studio"
ARG FOXGLOVE_VERSION="v1.31.0"
WORKDIR /src

RUN apt update && apt install --no-install-recommends -y git-lfs
RUN git clone -b $FOXGLOVE_VERSION --depth 1 $FOXGLOVE_REPO_URL /src
RUN corepack enable && yarn install --immutable
ENV FOXGLOVE_DISABLE_SIGN_IN=true
COPY injector/foxglove.patch .
RUN git apply foxglove.patch
RUN yarn run web:build:prod

FROM --platform=linux/amd64 node:16 as stream-panel-build
WORKDIR /src
COPY live-stream-panel/package.json live-stream-panel/package-lock.json ./
RUN npm install
COPY live-stream-panel ./
RUN npm run package

FROM --platform=$ARCH caddy:2.5.2-alpine
WORKDIR /src

COPY --from=foxglove-base /src/web/.webpack ./
COPY injector/bootstrap.sh injector/inject.js ./
RUN sed -i 's/<\/body>/<script src="inject.js" type="module"><\/script><\/body>/g' index.html
COPY --from=stream-panel-build /src/*.foxe ./

EXPOSE 8080
ENTRYPOINT ["/bin/sh", "-lca"]
CMD ["/src/bootstrap.sh && caddy file-server --listen :8080"]
