FROM node

COPY package.json ./
RUN npm install

COPY .babelrc ./
COPY index.js ./
COPY config.json ./
COPY lib/ ./lib/
COPY test/ ./test/

ENTRYPOINT ["npm", "test"]
