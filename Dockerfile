# Source: https://github.com/foxglove/studio/blob/main/Dockerfile
ARG ARCH="linux/amd64"

FROM --platform=linux/amd64 node:16 as foxglove-base
ARG FOXGLOVE_REPO_URL="https://github.com/foxglove/studio"
ARG FOXGLOVE_VERSION="v1.50.0"
WORKDIR /src

RUN apt update && apt install --no-install-recommends -y git-lfs
RUN git clone -b $FOXGLOVE_VERSION --depth 1 $FOXGLOVE_REPO_URL /src
RUN corepack enable && yarn install --immutable
RUN yarn add -D file-system-access
ENV FOXGLOVE_DISABLE_SIGN_IN=true
COPY foxglove.patch .
RUN git apply foxglove.patch
RUN yarn run web:build:prod

FROM --platform=linux/amd64 node:16 as extensions
WORKDIR /src
COPY extensions/package.json extensions/package-lock.json ./
RUN npm install
COPY extensions ./
RUN npm run package

FROM --platform=$ARCH caddy:2.5.2-alpine
WORKDIR /src
COPY --from=foxglove-base /src/web/.webpack ./
COPY --from=extensions /src/*.foxe ./
COPY bootstrap.sh ./

EXPOSE 8080
ENTRYPOINT ["/bin/sh", "-lca"]
CMD ["/src/bootstrap.sh && caddy file-server --listen :8080"]
