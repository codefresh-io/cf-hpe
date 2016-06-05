'use strict';

var Queue     = require('cf-queue');
var hpeConfig = require('./hpe-config');
var Q         = require('q');

class HpeDefects {

  constructor() {
    this.hpeDefects = new Queue('hpe/defects', hpeConfig.CF_QUEUE);
  }

  handleHpeDefect(payload) {
    if (payload) {
      return Q.resolve();
    }
    else {
      return Q.reject(new Error("error"));
    }
  }

  start() {
    this.hpeDefects.process(function (event, cb) {
      return self.handleHpeDefect(event.request)
        .done(() => cb(), (err) => cb(err));
    });
  }
}

module.exports = new HpeDefects();
