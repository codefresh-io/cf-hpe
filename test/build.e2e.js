/* eslint-env mocha */
/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-unused-expressions */
import './config.env';
import { expect } from 'chai';
import Build from 'app/build';
import BuildStep from 'app/build-step';

describe('Build', function () {
  this.slow(2000);
  this.timeout(30000);

  it('Should output running builds', function (done) {
    Build
      .builds()
      .take(1)
      .doOnNext(build => {
        done();
      })
      .doOnError(error => done(error))
      .subscribe();
  });

  it('Should output running build steps', function (done) {
    Build
      .builds()
      .take(1)
      .flatMap(build => BuildStep.steps(build))
      .doOnNext(buildStep => {

      })
      .doOnError(error => done(error))
      .subscribe();
  });
});
