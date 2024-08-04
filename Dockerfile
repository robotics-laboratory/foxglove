# Source: https://gist.github.com/AndBondStyle/ec7278f40a4ada7800b49c12aa68a153
ARG ARCH="linux/amd64"

FROM --platform=linux/amd64 node:16 as foxglove-base
WORKDIR /src
RUN apt update && apt install --no-install-recommends -y git-lfs
# Foxglove source code is no longer available on github
# Provide your own sources in "foxglove-sources" dir
COPY foxglove-source /src
RUN corepack enable && yarn install --immutable
ENV FOXGLOVE_DISABLE_SIGN_IN=true
RUN yarn run web:build:prod

FROM --platform=linux/amd64 node:16 as extensions
WORKDIR /src
COPY extensions/package.json extensions/package-lock.json ./
RUN npm install
COPY extensions ./
RUN npm run package
COPY scripts/add-file-hash.sh .
RUN find . -name "*.foxe" | xargs -n1 ./add-file-hash.sh

FROM --platform=$ARCH caddy:2.5.2-alpine
WORKDIR /src
COPY --from=foxglove-base /src/web/.webpack ./
COPY --from=extensions /src/*.foxe ./
COPY bootstrap.sh ./

EXPOSE 8080
ENTRYPOINT ["/bin/sh", "-lca"]
CMD ["/src/bootstrap.sh && caddy file-server --listen :8080"]
