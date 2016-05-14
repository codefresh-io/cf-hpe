/* eslint-env mocha */
/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-unused-expressions */
import './config.env';
import { expect } from 'chai';
import Build from 'app/build';
import BuildStep from 'app/build-step';
import HpeBuildSession from 'app/hpe-build-session';

describe('BuildHpe', function () {
  this.slow(2000);
  this.timeout(30000);

  it('Should open running build session', function (done) {
    Build
      .builds()
      .take(1)
      .flatMap(build => {
        return HpeBuildSession
          .openSession(build)
          .map(hpeBuild => {
            done();
          });
      })
      .doOnError(error => done(error))
      .subscribe();
  });
});
