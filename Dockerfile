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
COPY injector/ExtensionDetails.tsx.patch .
RUN patch -p1 packages/studio-base/src/components/ExtensionDetails.tsx ExtensionDetails.tsx.patch 
RUN yarn run web:build:prod

FROM --platform=linux/amd64 node:16 as stream-panel-build
WORKDIR /src
COPY live-stream-panel ./
RUN npm install && npm run package

FROM --platform=$ARCH caddy:2.5.2-alpine
WORKDIR /src

COPY --from=foxglove-base /src/web/.webpack ./
COPY injector/bootstrap.sh injector/loader.js ./
RUN sed -i 's/<\/body>/<script src="loader.js"><\/script><\/body>/g' index.html
COPY --from=stream-panel-build /src/*.foxe ./

EXPOSE 8080
ENTRYPOINT ["/bin/sh", "-lca"]
CMD ["/src/bootstrap.sh && caddy file-server --listen :8080"]
