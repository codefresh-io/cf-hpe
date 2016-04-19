FROM node

COPY package.json ./
RUN npm install

COPY index.js ./
COPY config.json ./
COPY lib/ ./lib/
COPY test/ ./test/

ENTRYPOINT "node test"
