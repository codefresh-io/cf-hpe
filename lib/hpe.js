'use strict';

import _ from 'lodash';
import Rx from 'rx';
import RequestRx from './request-rx';
import config from '../config.json';

class HpeError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

class HpeAuthError extends HpeError {
  constructor(statusCode) {
    super("HpeAuthError", statusCode);
  }
}

class Hpe {
  static authenticate() {
    const options = {
      jar: true,
      json: true,
      uri: config.hpe.serverUrl + '/authentication/sign_in/',
      body: {
        'user': config.hpe.user,
        'password': config.hpe.password
      },
    };

    return RequestRx
      .post(options)
      .map(response => {
        if(response.statusCode !== 200) {
          throw new HpeAuthError(response.statusCode);
        }

        const authCookies = response;

      });
  }

  static createCiServer(ciServer) {
    ciServer = _.assign(
      ciServer,
      {
        server_type: "CodeFresh"
      });

    const options = {
      jar: true,
      json: true,
      uri: config.hpe.serverUrl + '/api/shared_spaces/1001/workspaces/1001/ci_servers/',
      body: {
        data: [ciServer]
      }
    };

    return RequestRx
      .post(options)
      .map(response => {
        if (response.statusCode !== 200) {
          throw new HpeAuthError(response.statusCode);
        }

        const authCookies = response;

      });
  }

  static getCIServer() {
    return Rx.Observable.throw(new HpeError("failed"));
  }

  static createPipeLine() {
    return Rx.Observable.throw(new HpeError("failed"));
  }
}

export default Hpe;
