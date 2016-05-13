/* eslint-env mocha */
/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-unused-expressions */
import './config.env';
import { expect } from 'chai';
import RunningBuild from 'app/running-build';

describe('RunningsBuild', function () {
  this.slow(2000);
  this.timeout(30000);

  it('Should receive builds events', function (done) {
    RunningBuild
      .create()
      .doOnNext(buildLogRef => {

      })
      .doOnError(error => done(error))
      .subscribe();
  });
});
