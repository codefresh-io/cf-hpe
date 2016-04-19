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

class Hpe {
  static authenticate() {
    var options = {
      uri: config.hpe.serverUrl + '/authenticate/sign_in/',
      json: true,
      body: {
        'user': config.hpe.user,
        'password': config.hpe.server
      },
    };

    return RequestRx
      .post(options)
      .map(result => {
        console.log(result);
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
