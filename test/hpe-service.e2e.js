/* eslint-env mocha */
/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */
import './config.env';
import { expect } from 'chai';
import { HpeService } from 'cf-hpe';

describe('HpeService', function () {
  before(function () {
    this.slow(5000);
    this.timeout(15000);

    this.testSuitState = {
      service: undefined,
    };
  });

  beforeEach(function () {
  });

  it('Should create a service', function (done) {
    HpeService
      .create()
      .subscribe(
        service => {
          this.testSuitState.service = service;
          done();
        },
        error => done(error));
  });
});
