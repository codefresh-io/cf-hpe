# cf-hpe service
# Environment Variables:
# CF_HPE_INTEGRATION_ACCOUNT
# CF_HPE_FIREBASE_BUILD_LOGS_URL
# CF_HPE_FIREBASE_SECRET
# CF_HPE_MONGODB_URL
# CF_HPE_SERVER_URL
# CF_HPE_USER
# CF_HPE_PASSWORD
# CF_HPE_SHARED_SPACE
# CF_HPE_WORKSPACE

FROM node

ENV workdir /usr/src/app
RUN mkdir -p ${workdir}
WORKDIR ${workdir}

COPY package.json ${workdir}
RUN npm install
COPY ./dist ${workdir}/dist
CMD npm start
