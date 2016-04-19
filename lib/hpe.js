'use strict';

import _ from 'lodash';
import Rx from 'rx';
import RequestRx from './request-rx';
import config from '../config.json';

class HpeError extends Error {
  constructor(message) {
    super(message);
  }
}

class HpeAuthError extends HpeError {
  constructor() {
    super("HpeAuthError");
  }
}

class Hpe {
  static authenticate() {

    const options = {
      uri: config.hpe.serverUrl + '/authentication/sign_in/',
      json: true,
      body: {
        'user': config.hpe.user,
        'password': config.hpe.password
      },
    };

    return RequestRx
      .post(options)
      .map(result => {
        if(result.statusCode !== 200) {
          throw new HpeAuthError();
        }
      });
  }

  static createCIServer() {
    return Rx.Observable.throw(new HpeError("failed"));
  }

  static getCIServer() {
    return Rx.Observable.throw(new HpeError("failed"));
  }

  static createPipeLine() {
    return Rx.Observable.throw(new HpeError("failed"));
  }
}

export default Hpe;
