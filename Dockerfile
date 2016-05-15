FROM node

ENV workdir /usr/src/app
RUN mkdir -p ${workdir}
WORKDIR ${workdir}

COPY package.json ${workdir}
RUN npm install
COPY ./dist ${workdir}
CMD npm start
