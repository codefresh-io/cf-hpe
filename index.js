'use strict';
import _ from 'lodash';
import Rx from 'rx';
import Request from 'request';

class HpeError extends Error {
  constructor(message) {
    super(message);
  }
}

class Hpe {
  static authenticate() {
    return Rx.Observable.throw(new HpeError("failed"));
  }

  static createCIServer() {
    return Rx.Observable.throw(new HpeError("failed"));
  }

  static createPipeLine() {
    return Rx.Observable.throw(new HpeError("failed"));
  }
}

export default Hpe;
