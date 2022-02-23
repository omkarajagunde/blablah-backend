FROM ubuntu:latest as BUILD_IMAGE
#  add libraries; sudo so non-root user added downstream can get sudo

RUN apt-get update && apt-get install -y xz-utils \
        build-essential \
        sudo \
        curl \
        g++ \
        python3 \
        ;

ENV NODE_VERSION 14.18.2

RUN ARCH= && dpkgArch="$(dpkg --print-architecture)" \
  && case "${dpkgArch##*-}" in \
    amd64) ARCH='x64';; \
    ppc64el) ARCH='ppc64le';; \
    s390x) ARCH='s390x';; \
    arm64) ARCH='arm64';; \
    armhf) ARCH='armv7l';; \
    i386) ARCH='x86';; \
    *) echo "unsupported architecture"; exit 1 ;; \
  esac \
  && curl -fsSLO --compressed "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-$ARCH.tar.xz" \
  && tar -xJf "node-v$NODE_VERSION-linux-$ARCH.tar.xz" -C /usr/local --strip-components=1 --no-same-owner \
  && rm "node-v$NODE_VERSION-linux-$ARCH.tar.xz" \
  && ln -s /usr/local/bin/node /usr/local/bin/nodejs \
  # smoke tests
  && node --version \
  && npm --version
    
WORKDIR /app

COPY package.json ./

# install dependencies
RUN npm install --production && npm rebuild bcrypt --build-from-source && npm cache clean --force 

COPY . .

# remove dev dependencies
RUN npm prune --production

EXPOSE 8080

#CMD ["npm", "run", "prod"]

RUN npm install pm2 -g
ENV PM2_PUBLIC_KEY op08ifwwstx3bd2
ENV PM2_SECRET_KEY hhlaehfly8duzm0

CMD ["pm2-runtime", "./server/index.js"]